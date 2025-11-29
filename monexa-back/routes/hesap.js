import express from 'express';
import { getPool, sql } from '../../db.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();


// Hesap Olustur
router.post('/olustur', auth, async (req, res) => {
  const { user_id, iban_no, hesap_turu, bakiye } = req.body;
  if (!user_id || !iban_no || !hesap_turu) 
    return res.status(400).json({ message: 'Eksik alan' });

  try {
    const pool = await getPool();
    const acilis_tarihi = new Date();

    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('iban_no', sql.NVarChar(20), iban_no)
      .input('hesap_turu', sql.NVarChar(50), hesap_turu)
      .input('bakiye', sql.Decimal(18,2), bakiye || 0)
      .input('acilis_tarihi', sql.DateTime2, acilis_tarihi)
      .query(`
        INSERT INTO Hesap (UserId, IbanNo, HesapTuru, Bakiye, AcilisTarihi)
        VALUES (@user_id, @iban_no, @hesap_turu, @bakiye, @acilis_tarihi);
        SELECT SCOPE_IDENTITY() AS hesap_id;
      `);

    const hesapId = result.recordset[0].hesap_id;

    return res.status(201).json({
      message: 'Hesap oluşturuldu',
      hesap: {
        hesap_id: hesapId,
        user_id,
        iban_no,
        hesap_turu,
        bakiye: bakiye || 0,
        acilis_tarihi
      }
    });

  } catch (err) {
    console.error('HESAP OLUSTUR HATASI:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});


//Kullanıcının Tüm Hesaplarını Listele
router.get('/:user_id', auth, async (req, res) => {
  const user_id = parseInt(req.params.user_id, 10);
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query('SELECT * FROM Hesap WHERE UserId = @user_id');
    return res.json(result.recordset);
  } catch (err) {
    console.error('HESAP GET HATASI:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
