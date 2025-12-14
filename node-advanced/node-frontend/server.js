import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

import commonConfig, { commonParams } from "../node-common/config/index.js";
import config from "./config/config.js";
import siteRoutes from "./routes/SiteRoutes.js";
import { loadUser } from "./middlewares/loadUser.js";

dotenv.config();

const app = express();

// Xác định đường dẫn gốc
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware cơ bản
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loadUser);
app.use(express.static(path.join(__dirname, "public")));

// ================================
// Middleware đưa user vào EJS
// ================================
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// ================================
// Cấu hình EJS + Layout
// ================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Cấu hình thư mục public
app.use(express.static(path.join(__dirname, "public")));

// ================================
// Đăng ký route chính
// ================================
app.use("/", siteRoutes);

// ================================
// Trang chủ
// ================================
app.get("/", (req, res) => {
  res.render("site/index", {
    title: "Home",
    user: req.user || null,
    layout: "layouts/main"
  });
});

// ================================
// Trang lỗi 404
// ================================
app.use((req, res) => {
  res.status(404).render("site/error", {
    title: "404 Not Found",
    message: "Trang bạn yêu cầu không tồn tại.",
    layout: "layouts/blank"
  });
});

// ================================
// Xử lý lỗi toàn cục
// ================================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  if (config?.errorHandler?.handler) {
    config.errorHandler.handler(err, req, res, next);
  } else {
    res.status(500).render("site/error", {
      title: "Server Error",
      message: err.message || "Đã xảy ra lỗi nội bộ.",
      layout: "layouts/blank"
    });
  }
});

// ================================
// Khởi động server
// ================================
const PORT = process.env.PORT || config.port || 3000;
app.listen(PORT, () => {
  console.log(`${config.id || "app-frontend"} running on port ${PORT}`);
  console.log("Common params loaded:", commonParams.adminEmail);
  console.log("Frontend ready on http://localhost:" + PORT);
});
