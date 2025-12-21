// ====================================================
// node-common/config/index.js
// Common configuration entry point (used in backend)
// Aggregates all common settings for the application
// ====================================================

import dotenv from "dotenv";
dotenv.config();

import * as aliases from "./aliases.js";
import * as cache from "./cache.js";
import * as params from "./params.js";
import * as test from "./test.js";
// import * as db from "./db.js"; // thêm sau nếu cần

// ----------------------------------------------------
// Cấu hình tham số môi trường dùng chung
// ----------------------------------------------------
export const commonParams = {
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  env: process.env.NODE_ENV || "development"
};

// ----------------------------------------------------
// Gộp cấu hình chung thành 1 đối tượng xuất mặc định
// ----------------------------------------------------
const commonConfig = {
  aliases,
  cache,
  params,
  test,
  commonParams,
  // db // nếu có
};

export default commonConfig;
