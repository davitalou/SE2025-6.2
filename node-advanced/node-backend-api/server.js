import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

import commonConfig, { commonParams } from "../node-common/config/index.js";
import config from "./config/config.js";
import siteRoutes from "./routes/SiteRoutes.js";
import { loadUser } from "./middlewares/loadUser.js";

dotenv.config();

const app = express();

// Xác định đường dẫn gốc (phục vụ tĩnh nếu cần)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware cơ bản cho API
app.use(cors({ origin: true, credentials: true }));
app.use(loadUser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

// Đăng ký route chính (API thuần JSON)
app.use("/api/site", siteRoutes);

// 404 cho API
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Xử lý lỗi toàn cục cho API
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  if (config?.errorHandler?.handler) {
    return config.errorHandler.handler(err, req, res, next);
  }
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Khởi động server
const PORT = process.env.PORT || config.port || 3001;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`${config.id || "app-backend-api"} running on ${HOST}:${PORT}`);
  console.log("Common params loaded:", commonParams.adminEmail);
  console.log(`API endpoints start at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/api/site`);
});
