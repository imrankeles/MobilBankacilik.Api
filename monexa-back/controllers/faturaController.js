import sql from "../db.js";

export const getFaturalar = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await sql.query`
      SELECT f.*, t.fatura_turu_adi
      FROM Fatura f
      JOIN Fatura_Turu t ON t.fatura_turu_id = f.fatura_turu_id
      WHERE f.user_id = ${userId}
    `;

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

export const createFatura = async (req, res, next) => {
  try {
    const { user_id, fatura_turu_id, kurum_adi, tutar, son_odeme_tarihi } = req.body;

    await sql.query`
      INSERT INTO Fatura (user_id, fatura_turu_id, kurum_adi, tutar, son_odeme_tarihi)
      VALUES (${user_id}, ${fatura_turu_id}, ${kurum_adi}, ${tutar}, ${son_odeme_tarihi})
    `;

    res.status(201).json({ success: true, message: "Fatura oluşturuldu" });
  } catch (err) {
    next(err);
  }
};
