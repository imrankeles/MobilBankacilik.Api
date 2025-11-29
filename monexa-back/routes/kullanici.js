import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql, sqlConnect } from "../../db.js"; // db.js'deki sql ve bağlantı fonksiyonunu kullan
import Joi from "joi";

const JWT_SECRET = process.env.JWT_SECRET || "superSecretKey";

// Joi Şemaları --> veri doğrulama (validation) yapmak için
const kayitSchema = Joi.object({
  ad: Joi.string().min(2).required(),
  soyad: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  sifre: Joi.string().min(5).max(20).required(),
  telefon: Joi.string().optional().allow(""),
  tcno: Joi.string().length(11).optional().allow(""),
  adres: Joi.string().optional().allow("")
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  sifre: Joi.string().required()
});


// Kullanıcı Kaydı
router.post("/kayit", async (req, res) => {
  try {
    // Joi doğrulaması
    const { error } = kayitSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { ad, soyad, email, telefon, sifre, tcno, adres } = req.body;

    await sqlConnect(); // MSSQL bağlantısı

    const pool = await sql.connect();
    const request = pool.request();

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(sifre, 10);
    const kayitTarihi = new Date();

    request.input("Ad", sql.NVarChar(100), ad);
    request.input("SoyAd", sql.NVarChar(100), soyad);
    request.input("Email", sql.NVarChar(200), email);
    request.input("Telefon", sql.NVarChar(50), telefon || null);
    request.input("Sifre", sql.NVarChar(500), passwordHash);
    request.input("TcNo", sql.NVarChar(11), tcno || null);
    request.input("Adres", sql.NVarChar(500), adres || null);
    request.input("KayitTarihi", sql.DateTime2, kayitTarihi);

    const insertQuery = `
      INSERT INTO dbo.Kullanicilar 
        (Ad, SoyAd, Email, Telefon, Sifre, TcNo, Adres, KayitTarihi)
      VALUES 
        (@Ad, @SoyAd, @Email, @Telefon, @Sifre, @TcNo, @Adres, @KayitTarihi)
    `;

    await request.query(insertQuery);

    return res.json({
      message: "Kullanıcı başarıyla oluşturuldu.",
      KayitTarihi: kayitTarihi
    });

  } catch (err) {
    console.error("KAYIT HATASI:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});


// Kullanıcı Girişi / Token
router.post("/login", async (req, res) => {
  try {
    // Joi doğrulaması
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, sifre } = req.body;

    await sqlConnect(); // MSSQL bağlantısı
    const pool = await sql.connect();
    const request = pool.request();

    request.input("Email", sql.NVarChar(200), email);

    const userQuery = `
      SELECT UserId, Ad, SoyAd, Email, Sifre
      FROM dbo.Kullanici
      WHERE Email = @Email
    `;
    const userResult = await request.query(userQuery);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    const user = userResult.recordset[0];

    const isMatch = await bcrypt.compare(sifre, user.Sifre);
    if (!isMatch) return res.status(401).json({ message: "Email veya şifre hatalı." });

    const token = jwt.sign(
      { UserId: user.UserId, Email: user.Email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const girisZamani = new Date();

    return res.json({
      message: "Giriş başarılı.",
      token,
      user: {
        UserId: user.UserId,
        Ad: user.Ad,
        SoyAd: user.SoyAd,
        Email: user.Email
      },
      GirisZamani: girisZamani
    });

  } catch (err) {
    console.error("LOGIN HATASI:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;
