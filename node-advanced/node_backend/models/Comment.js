const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'post',
      key: 'id'
    }
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'id'
    }
  }
}, {
  tableName: 'comment',
  timestamps: false,
  hooks: {
    beforeCreate: (comment) => {
      comment.created_at = Math.floor(Date.now() / 1000);
      comment.updated_at = Math.floor(Date.now() / 1000);
    },
    beforeUpdate: (comment) => {
      comment.updated_at = Math.floor(Date.now() / 1000);
    }
  }
});

// Define associations
Comment.associate = function(models) {
  // Comment belongs to User
  Comment.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'author'
  });
  
  // Comment belongs to Post
  Comment.belongsTo(models.Post, {
    foreignKey: 'post_id',
    as: 'post'
  });
};

module.exports = Comment;
