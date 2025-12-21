// ============================================
// node-common/config/params.js
// Common parameters for application settings
// ============================================

import dotenv from "dotenv";
dotenv.config();

export const params = {
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",

  // Cấu hình email gửi đi
  senderEmail: process.env.SMTP_USER || "se2025.6.2@gmail.com",
  senderName: process.env.SENDER_NAME || "Your Game Support",

  user: {
    passwordResetTokenExpire: 3600, // thời gian hết hạn reset password (giây)
    passwordMinLength: 8,           // độ dài tối thiểu của mật khẩu
  },
};
