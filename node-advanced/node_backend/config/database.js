const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use SQLite for easier setup (no MySQL required)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: false // We handle timestamps manually
  }
});

module.exports = sequelize;
