import express from "express";
const router = express.Router();
import { getPool, sql } from '../../db.js';
import { auth } from '../middlewares/auth.js';

// make a transfer / transaction
router.post('/yap', auth, async (req, res) => {
  const { from_hesap_id, to_iban_no, tutar, aciklama } = req.body;
  if (!from_hesap_id || !to_iban_no || !tutar) return res.status(400).json({ message: 'Eksik alan' });

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); // sıkı izolasyon - tutar kontrolü için
    const trReq = transaction.request();

    // 1) kaynak hesabı getir
    const srcRes = await trReq.input('fromId', sql.Int, from_hesap_id)
      .query('SELECT HesapId, Bakiye, IbanNo FROM Hesap WHERE HesapId = @fromId');

    if (!srcRes.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Kaynak hesap bulunamadı' });
    }
    const src = srcRes.recordset[0];

    // 2) hedef hesabı iban ile getir
    const dstRes = await trReq.input('toIban', sql.NVarChar(20), to_iban_no)
      .query('SELECT HesapId, Bakiye FROM Hesap WHERE IbanNo = @toIban');

    if (!dstRes.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Hedef hesap bulunamadı' });
    }
    const dst = dstRes.recordset[0];

    // 3) bakiye kontrol
    if (src.bakiye < tutar) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Yetersiz bakiye' });
    }

    // 4) bakiye güncelle
    await trReq.input('newSrcBalance', sql.Decimal(18,2), src.bakiye - tutar)
      .input('srcId', sql.Int, src.hesap_id)
      .query('UPDATE Hesap SET Bakiye = @newSrcBalance WHERE HesapId = @srcId');

    await trReq.input('newDstBalance', sql.Decimal(18,2), dst.bakiye + tutar)
      .input('dstId', sql.Int, dst.hesap_id)
      .query('UPDATE Hesap SET Bakiye = @newDstBalance WHERE HesapId = @dstId');

    // 5) işlem kayıtları ekle (kaynak)
    await trReq.input('hesapId', sql.Int, src.hesap_id)
      .input('islem_turu', sql.NVarChar(50), 'Havale/Transfer - Gönderim')
      .input('tutar', sql.Decimal(18,2), tutar)
      .input('aciklama', sql.NVarChar(255), aciklama || null)
      .input('hedef_hesap', sql.NVarChar(20), to_iban_no)
      .query(`
        INSERT INTO Islem (HesapId, IslemTuru, Tutar, Aciklama, HedefHesap)
        VALUES (@hesapId, @islem_turu, @tutar, @aciklama, @hedef_hesap)
      `);

    // hedef için işlem kaydı
    await trReq.input('hesapId2', sql.Int, dst.hesap_id)
      .input('islem_turu2', sql.NVarChar(50), 'Havale/Transfer - Alım')
      .input('tutar2', sql.Decimal(18,2), tutar)
      .input('aciklama2', sql.NVarChar(255), `Alındı: ${aciklama || ''}`)
      .input('hedef_hesap2', sql.NVarChar(20), src.iban_no)
      .query(`
        INSERT INTO Islem (HesapId, IslemTuru, Tutar, Aciklama, HedefHesap)
        VALUES (@hesapId2, @islem_turu2, @tutar2, @aciklama2, @hedef_hesap2)
      `);

    await transaction.commit();
    return res.json({ message: 'Transfer başarılı' });

  } catch (err) {
    console.error('Transfer error:', err);
    try { await transaction.rollback(); } catch (e) { /* ignore */ }
    return res.status(500).json({ message: 'Transfer hatası' });
  }
});

// get transactions by hesap_id
router.get('/:hesap_id', auth, async (req, res) => {
  const hesap_id = parseInt(req.params.hesap_id, 10);
  try {
    const pool = await getPool();
    const result = await pool.request().input('hesap_id', sql.Int, hesap_id)
      .query('SELECT * FROM Islem WHERE HesapId = @hesap_id ORDER BY Tarih DESC');
    return res.json(result.recordset);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
