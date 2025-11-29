import express from 'express'; 
import { getPool, sql } from '../../db.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "superSecretKey";

router.post('/', async (req, res) => {
  try {
    const { email, password, cihazBilgisi, ipAdresi } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email ve şifre gerekli." });
    }

    const pool = await getPool();
    const request = pool.request();
    request.input("email", sql.NVarChar(200), email);

    // Kullanıcıyı DB'den çek
    const userQuery = `
      SELECT UserId, Email, Sifre
      FROM dbo.Kullanici
      WHERE Email = @email
    `;

    const userResult = await request.query(userQuery);
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    const user = userResult.recordset[0];

    // Şifreyi doğrula
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    // 🔐 JWT Token üret
    const token = jwt.sign(
      {
        UserId: user.UserId,
        Email: user.Email
      },
      JWT_SECRET,
      { expiresIn: "2h" } // 2 saat geçerli
    );

    // 📌 loginLog tablosuna giriş kaydı ekle
    const logReq = pool.request();
    logReq.input("UserId", sql.Int, user.UserId);
    logReq.input("CihazBilgisi", sql.NVarChar(500), cihazBilgisi || null);
    logReq.input("IpAdresi", sql.NVarChar(50), ipAdresi || null);

    const logQuery = `
      INSERT INTO dbo.loginLog (UserId, GirisZamani, CihazBilgisi, IpAdresi)
      VALUES (@UserId, SYSUTCDATETIME(), @CihazBilgisi, @IpAdresi)
    `;
    await logReq.query(logQuery);

    // 🔥 Sonuç olarak TOKEN + USER bilgisi dön
    return res.json({
      message: "Giriş başarılı.",
      token: token,
      user: {
        UserId: user.UserId,
        Email: user.Email
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;