import sql from "../db.js";

export const getLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await sql.query`
      SELECT * FROM Login_Log WHERE user_id = ${userId}
    `;

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};
