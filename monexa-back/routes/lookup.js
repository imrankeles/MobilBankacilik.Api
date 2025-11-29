import express from "express";
const router = express.Router();
import { getPool, sql } from '../../db.js';

router.get('/kart-turleri', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM KartTuru');
  res.json(result.recordset);
});

router.get('/fatura-turleri', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM FaturaTuru');
  res.json(result.recordset);
});

router.get('/durumlar', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM Durum');
  res.json(result.recordset);
});

export default router;
