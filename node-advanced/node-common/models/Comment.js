import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { Post } from "./Post.js";

export class Comment extends Model {}

Comment.init(
  {
    title: { type: DataTypes.STRING(512) },
    body: { type: DataTypes.TEXT },
    post_id: { type: DataTypes.INTEGER },
    created_by: { type: DataTypes.INTEGER },
  },
  { sequelize, modelName: "Comment", tableName: "comment" }
);

// Quan hệ
Comment.belongsTo(User, { foreignKey: "created_by", as: "createdBy" });
Comment.belongsTo(Post, { foreignKey: "post_id", as: "post" });
Post.hasMany(Comment, { foreignKey: "post_id", as: "comments" });
