import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import morgan from "morgan";
import { sqlConnect } from "./db.js";
import errorHandler from "./monexa-back/middlewares/errorHandler.js";
import kullaniciRoute from "./monexa-back/routes/kullanici.js";
import hesapRoute from "./monexa-back/routes/hesap.js";
import faturaRoute from "./monexa-back/routes/fatura.js";
import kartRoute from "./monexa-back/routes/kart.js";
import logRoute from "./monexa-back/routes/LogİnLog.js";
import lookupRoute from "./monexa-back/routes/lookup.js";
import islemRoute from "./monexa-back/routes/islem.js";

// Load .env
dotenv.config();

const app = express();
const PORT = 3000;

// Express outsource
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Upper limit for request
    message: "Çok fazla istek gönderildi, lütfen daha sonra deneyin.",
  })
);

app.use("/api/kullanici", kullaniciRoute);
app.use("/api/hesap", hesapRoute);
app.use("/api/fatura", faturaRoute);
app.use("/api/islem", islemRoute);
app.use("/api/kart", kartRoute);
app.use("/api/login-log", logRoute);
app.use("/api", lookupRoute);

app.use(errorHandler);

sqlConnect();

app.listen(PORT, () => console.log("http://localhost:3000"));

