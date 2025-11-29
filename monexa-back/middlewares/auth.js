import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token yok' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token format hatası' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
}
