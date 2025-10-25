const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true
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
  tableName: 'post',
  timestamps: false,
  hooks: {
    beforeCreate: (post) => {
      post.created_at = Math.floor(Date.now() / 1000);
      post.updated_at = Math.floor(Date.now() / 1000);
    },
    beforeUpdate: (post) => {
      post.updated_at = Math.floor(Date.now() / 1000);
    }
  }
});

// Define associations
Post.associate = function(models) {
  // Post belongs to User
  Post.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'author'
  });
  
  // Post has many Comments
  Post.hasMany(models.Comment, {
    foreignKey: 'post_id',
    as: 'comments'
  });
};

module.exports = Post;
