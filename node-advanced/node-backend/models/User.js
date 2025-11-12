import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import bcrypt from "bcrypt";

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    auth_key: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    access_token: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 10,
    },
    created_at: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "user",
    timestamps: false, // vì em dùng created_at / updated_at kiểu số (UNIX timestamp)
  }
);

// Hash mật khẩu trước khi lưu
User.beforeCreate(async (user) => {
  if (user.password_hash && !user.password_hash.startsWith("$2b$")) {
    const saltRounds = 10;
    user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
  }

  // Tạo auth_key, created_at, updated_at
  user.auth_key = Math.random().toString(36).substring(2, 15);
  const now = Math.floor(Date.now() / 1000);
  user.created_at = now;
  user.updated_at = now;
});

User.beforeUpdate(async (user) => {
  if (user.changed("password_hash") && !user.password_hash.startsWith("$2b$")) {
    const saltRounds = 10;
    user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
  }
  user.updated_at = Math.floor(Date.now() / 1000);
});
