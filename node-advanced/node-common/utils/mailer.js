import nodemailer from "nodemailer";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import commonConfig from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo transporter (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "noreply@example.com",
    pass: process.env.SMTP_PASS || "yourpassword"
  }
});

/**
 * Gửi email với template EJS (thay thế Yii2 mail view)
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} template - Tên template (không có phần mở rộng)
 * @param {object} data - Dữ liệu truyền vào EJS
 */
export async function sendMail({ to, subject, template, data }) {
  try {
    const htmlPath = path.join(__dirname, "../templates/email", `${template}.html`);
    const textPath = path.join(__dirname, "../templates/email", `${template}.txt`);

    const htmlContent = fs.existsSync(htmlPath)
      ? fs.readFileSync(htmlPath, "utf-8")
      : "";
    const textContent = fs.existsSync(textPath)
      ? fs.readFileSync(textPath, "utf-8")
      : "";

    const html = htmlContent ? ejs.render(htmlContent, data) : undefined;
    const text = textContent ? ejs.render(textContent, data) : undefined;

    const info = await transporter.sendMail({
      from: commonConfig.params.senderEmail,
      to,
      subject,
      html,
      text
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}
