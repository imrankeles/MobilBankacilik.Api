import sql from "../db.js";

export const getKartlar = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await sql.query`
      SELECT k.*, t.kart_turu_adi
      FROM Kart k
      JOIN Kart_Turu t ON t.kart_turu_id = k.kart_turu_id
      WHERE k.user_id = ${userId}
    `;

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

export const createKart = async (req, res, next) => {
  try {
    const { user_id, kart_turu_id, limit_miktari, bakiye } = req.body;

    const kart_no = Math.random().toString().slice(2, 18);
    const cvv = Math.floor(Math.random() * 900 + 100).toString();
    const son_kullanma = "12/30";

    await sql.query`
      INSERT INTO Kart (user_id, kart_no, son_kullanma, cvv, kart_turu_id, limit_miktari, bakiye)
      VALUES (${user_id}, ${kart_no}, ${son_kullanma}, ${cvv}, ${kart_turu_id}, ${limit_miktari}, ${bakiye})
    `;

    res.status(201).json({ success: true, kart_no, cvv });
  } catch (err) {
    next(err);
  }
};