import sql from "../db.js";

export const getIslemler = async (req, res, next) => {
  try {
    const { hesapId } = req.params;

    const result = await sql.query`
      SELECT * FROM Islem WHERE hesap_id = ${hesapId}
    `;

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

export const createIslem = async (req, res, next) => {
  try {
    const { hesap_id, islem_turu, tutar, aciklama, hedef_hesap } = req.body;

    await sql.query`
      INSERT INTO Islem (hesap_id, islem_turu, tutar, aciklama, hedef_hesap)
      VALUES (${hesap_id}, ${islem_turu}, ${tutar}, ${aciklama}, ${hedef_hesap})
    `;

    res.status(201).json({ success: true, message: "İşlem oluşturuldu" });
  } catch (err) {
    next(err);
  }
};
