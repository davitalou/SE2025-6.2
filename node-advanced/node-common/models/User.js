import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import bcrypt from "bcryptjs";

export class User extends Model {
  // Kiểm tra mật khẩu
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  // Sinh hash mới khi đăng ký hoặc đổi mật khẩu
  async setPassword(password) {
    this.password_hash = await bcrypt.hash(password, 10);
  }
}

User.init(
  {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    auth_key: { type: DataTypes.STRING },
    status: { type: DataTypes.INTEGER, defaultValue: 9 }, // INACTIVE
  },
  { sequelize, modelName: "User", tableName: "user" }
);
