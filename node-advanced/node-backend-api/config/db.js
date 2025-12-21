// node-backend/config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Tạo kết nối tới MySQL bằng biến môi trường từ .env
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

// Kiểm tra kết nối
(async () => {
  try {
    await sequelize.authenticate();
    console.log(`Database "${process.env.DB_NAME}" connection has been established successfully.`);
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
})();
