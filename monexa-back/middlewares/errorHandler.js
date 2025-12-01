export default function errorHandler(err, req, res, next) {
  console.error("💥 Hata yakalandı:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Sunucu hatası oluştu.",
  });
  next()
}