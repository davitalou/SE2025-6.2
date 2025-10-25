require('dotenv').config();

module.exports = {
  appId: 'node-backend',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key',
  sessionName: 'node-session',
  logLevel: process.env.LOG_LEVEL || 'warn',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com'
};