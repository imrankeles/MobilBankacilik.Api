import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_NAME || "MobilBankacilik",
  server: process.env.DB_SERVER || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT): 1433,
  options: {
    encrypt: false, // true istersen güvenli bağlantı
    trustServerCertificate: true,
  },
};

// Pool oluşturma ve tekrar kullanma
let pool;

export async function getPool() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("✅ MSSQL bağlantısı başarılı (pool oluşturuldu)");
    }
    return pool;
  } catch (err) {
    console.error("❌ Veritabanı bağlantı hatası:", err);
    throw err;
  }
}

// İsteğe bağlı manuel connect fonksiyonu
export async function sqlConnect() {
  try {
    await getPool();
  } catch (err) {
    console.error("❌ Veritabanı bağlantı hatası (manual connect):", err);
  }
}

export { sql };


