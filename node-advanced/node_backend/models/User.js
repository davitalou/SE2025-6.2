const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  auth_key: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 9, // STATUS_INACTIVE
    validate: {
      isIn: [[0, 9, 10]] // STATUS_DELETED, STATUS_INACTIVE, STATUS_ACTIVE
    }
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'user',
  timestamps: false,
  hooks: {
    beforeCreate: (user) => {
      user.created_at = Math.floor(Date.now() / 1000);
      user.updated_at = Math.floor(Date.now() / 1000);
    },
    beforeUpdate: (user) => {
      user.updated_at = Math.floor(Date.now() / 1000);
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.setPassword = async function(password) {
  this.password_hash = await bcrypt.hash(password, 10);
};

User.prototype.generateAuthKey = function() {
  this.auth_key = require('crypto').randomBytes(16).toString('hex');
};

User.prototype.generatePasswordResetToken = function() {
  this.password_reset_token = require('crypto').randomBytes(32).toString('hex') + '_' + Math.floor(Date.now() / 1000);
};

User.prototype.generateEmailVerificationToken = function() {
  this.verification_token = require('crypto').randomBytes(32).toString('hex') + '_' + Math.floor(Date.now() / 1000);
};

User.prototype.removePasswordResetToken = function() {
  this.password_reset_token = null;
};

User.prototype.generateAccessToken = function() {
  return jwt.sign(
    { id: this.id, username: this.username },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: '1h' }
  );
};

// Static methods
User.findByUsername = async function(username) {
  return await this.findOne({
    where: { username, status: 10 } // STATUS_ACTIVE
  });
};

User.findByEmail = async function(email) {
  return await this.findOne({
    where: { email, status: 10 } // STATUS_ACTIVE
  });
};

User.findByPasswordResetToken = async function(token) {
  if (!token) return null;
  
  const user = await this.findOne({
    where: { password_reset_token: token, status: 10 }
  });
  
  if (!user) return null;
  
  // Check if token is expired (24 hours)
  const timestamp = parseInt(token.split('_').pop());
  const expireTime = 24 * 60 * 60; // 24 hours in seconds
  if (timestamp + expireTime < Math.floor(Date.now() / 1000)) {
    return null;
  }
  
  return user;
};

User.findByVerificationToken = async function(token) {
  return await this.findOne({
    where: { verification_token: token, status: 9 } // STATUS_INACTIVE
  });
};

User.isPasswordResetTokenValid = function(token) {
  if (!token) return false;
  
  const timestamp = parseInt(token.split('_').pop());
  const expireTime = 24 * 60 * 60; // 24 hours in seconds
  return timestamp + expireTime >= Math.floor(Date.now() / 1000);
};

// Define associations
User.associate = function(models) {
  // User has many Posts
  User.hasMany(models.Post, {
    foreignKey: 'created_by',
    as: 'posts'
  });
  
  // User has many Comments
  User.hasMany(models.Comment, {
    foreignKey: 'created_by',
    as: 'comments'
  });
};

module.exports = User;
