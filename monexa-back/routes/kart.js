import express from "express";
const router = express.Router();
import { getPool, sql } from '../../db.js';
import { auth } from '../middlewares/auth.js';

router.post('/olustur', auth, async (req, res) => {
  const { user_id, kart_no, son_kullanma, cvv, kart_turu_id, limit_miktari, bakiye } = req.body;
  if (!user_id || !kart_no || !son_kullanma || !cvv || !kart_turu_id) return res.status(400).json({ message: 'Eksik alan' });

  try {
    const pool = await getPool();
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('kart_no', sql.NVarChar(16), kart_no)
      .input('son_kullanma', sql.NVarChar(8), son_kullanma)
      .input('cvv', sql.NVarChar(3), cvv)
      .input('kart_turu_id', sql.Int, kart_turu_id)
      .input('limit_miktari', sql.Decimal(18,2), limit_miktari || null)
      .input('bakiye', sql.Decimal(18,2), bakiye || null)
      .query(`
        INSERT INTO Kart (UserId, KartNo, SonKullanma, Cvv, KartTuruId, LimitMiktari, Bakiye)
        VALUES (@user_id, @kart_no, @son_kullanma, @cvv, @kart_turu_id, @limit_miktari, @bakiye)
      `);
    return res.status(201).json({ message: 'Kart oluşturuldu' });
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
      .query('SELECT * FROM Kart WHERE UserId = @user_id');
    return res.json(result.recordset);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
