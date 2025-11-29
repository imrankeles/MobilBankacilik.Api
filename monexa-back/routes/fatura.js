import express from "express";
const router = express.Router();
import { getPool, sql } from '../../db.js';
import { auth } from '../middlewares/auth.js';


router.post('/ekle', auth, async (req, res) => {
  const { user_id, fatura_turu_id, kurum_adi, tutar, son_odeme_tarihi } = req.body;
  if (!user_id || !fatura_turu_id || !tutar || !son_odeme_tarihi) return res.status(400).json({ message: 'Eksik alan' });

  try {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('fatura_turu_id', sql.Int, fatura_turu_id)
      .input('kurum_adi', sql.NVarChar(100), kurum_adi || null)
      .input('tutar', sql.Decimal(18,2), tutar)
      .input('son_odeme_tarihi', sql.Date, new Date(son_odeme_tarihi))
      .query(`
        INSERT INTO Fatura (UserId, FaturaTuruId, KurumAdi, Tutar, SonOdemeTarihi)
        VALUES (@user_id, @fatura_turu_id, @kurum_adi, @tutar, @son_odeme_tarihi)
      `);
    return res.status(201).json({ message: 'Fatura eklendi' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/:user_id', auth, async (req, res) => {
  const user_id = parseInt(req.params.user_id, 10);
  try {
    const pool = await getPool();
    const result = await pool.request().input('user_id', sql.Int, user_id)
      .query('SELECT * FROM Fatura WHERE UserId = @user_id');
    return res.json(result.recordset);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
