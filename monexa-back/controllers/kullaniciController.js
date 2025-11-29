import bcrypt from "bcryptjs";
import { sql } from "../db.js";
import { generateToken } from "../helpers/tokenHelper.js";

export async function register(req, res, next) {
  try {
    const { ad, soyad, email, telefon, sifre, tc_no } = req.body;
    const hash = await bcrypt.hash(sifre, 10);
    await sql.query`
      INSERT INTO Kullanici (ad, soyad, email, telefon, sifre, tc_no)
      VALUES (${ad}, ${soyad}, ${email}, ${telefon}, ${hash}, ${tc_no})
    `;
    res.status(201).json({ message: "Kullanıcı kaydedildi." });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, sifre } = req.body;
    const result = await sql.query`SELECT * FROM Kullanici WHERE email = ${email}`;
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: "Kullanıcı bulunamadı." });

    const match = await bcrypt.compare(sifre, user.sifre);
    if (!match) return res.status(401).json({ message: "Şifre hatalı." });

    const token = generateToken({ userId: user.user_id });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}
