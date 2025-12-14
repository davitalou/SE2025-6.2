import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./User.js";

export class Post extends Model {}

Post.init(
  {
    title: { type: DataTypes.STRING(512), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    created_by: { type: DataTypes.INTEGER },
  },
  { sequelize, modelName: "Post", tableName: "post" }
);

// Quan hệ
Post.belongsTo(User, { foreignKey: "created_by", as: "createdBy" });
User.hasMany(Post, { foreignKey: "created_by", as: "posts" });
