import express from 'express';
import { getPool, sql } from '../../db.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

// Hesap Olustur
router.post('/olustur', async (req, res) => {
  const { user_id, iban_no, hesap_turu, bakiye } = req.body;
  if (!user_id || !iban_no || !hesap_turu) 
    return res.status(400).json({ message: 'Eksik alan' });

  try {
    const pool = await getPool();
    const acilis_tarihi = new Date();

    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('iban_no', sql.NVarChar(26), iban_no)
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

router.get("/iban", async (req, res) => {
  const iban_no = req.query.iban_no;
  try{
    const pool = await getPool();
    const result = await pool.request().input("iban_no", sql.NVarChar(26), iban_no)
    .query(`SELECT k.Ad, k.Soyad FROM dbo.Kullanici k
            JOIN dbo.Hesap h ON h.UserId = k.UserId
            WHERE h.IbanNo = @iban_no`);

    return res.json(
      result.recordset?.length 
        ? result.recordset[0]
        : result.recordset
    );

  }
  catch(e){
    console.error(e);
    res.sendStatus(500);
  }
});

//Kullanıcının Tüm Hesaplarını Listele
router.get('/:user_id', async (req, res) => {
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

router.get("/:user_id/:hesap_id", async (req, res) =>  {
  const hesap_id = parseInt(req.params.hesap_id);
  const user_id = parseInt(req.params.user_id);
  try{
    const pool = await getPool();
    const result = await pool.request()
      .input("hesap_id", sql.Int, hesap_id)
      .input("user_id", sql.Int, user_id)
      .query(`SELECT k.Ad, k.Soyad, h.* FROM dbo.Kullanici k
              JOIN dbo.Hesap h ON h.UserId = k.UserId
              WHERE h.HesapId = @hesap_id
              AND k.UserId = @user_id`);

    return res.json(result.recordset);
  }
  catch(e){
    console.error(e);
    return res.sendStatus(500);
  }
});


export default router;
