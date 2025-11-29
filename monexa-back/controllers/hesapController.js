import sql from "../db.js";
import { generateRandomIban } from "../utils/generateRandomIban.js";

export const getHesaplar = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await sql.query`
      SELECT * FROM Hesap WHERE user_id = ${userId}
    `;

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

export const createHesap = async (req, res, next) => {
  try {
    const { user_id, hesap_turu, bakiye } = req.body;
    const iban = generateRandomIban();

    await sql.query`
      INSERT INTO Hesap (user_id, iban_no, hesap_turu, bakiye)
      VALUES (${user_id}, ${iban}, ${hesap_turu}, ${bakiye})
    `;

    res.status(201).json({ success: true, message: "Hesap oluşturuldu", iban });
  } catch (err) {
    next(err);
  }
};
