import dotenv from "dotenv";
dotenv.config();

export default {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "node_app",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: console.log, // giống log của Yii2
  },
  test: {
    username: "root",
    password: "",
    database: "node_app_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
};
