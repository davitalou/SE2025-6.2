import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Cấu hình kết nối database
const DB_NAME = process.env.DB_NAME || "se2025";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

// Khởi tạo Sequelize
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  logging: false, // Tắt log SQL
});

// Kiểm tra kết nối khi khởi chạy
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
})();
