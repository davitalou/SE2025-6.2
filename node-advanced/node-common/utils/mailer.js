import nodemailer from "nodemailer";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import commonConfig from "../config/index.js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
console.log("SMTP config:", process.env.SMTP_USER, process.env.SMTP_PASS ? "loaded" : "missing");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Gửi email (có thể có hoặc không template)
 * @param {object} param0
 * @param {string} param0.to - email người nhận
 * @param {string} param0.subject - tiêu đề
 * @param {string} [param0.template] - template ejs
 * @param {object} [param0.data] - dữ liệu
 */
export async function sendMail({ to, subject, template = null, data = {} }) {
  try {
    if (!to) throw new Error("No recipients defined");

    let html, text;
    if (template) {
      const htmlPath = path.join(__dirname, "../templates/email", `${template}.html`);
      const textPath = path.join(__dirname, "../templates/email", `${template}.txt`);

      const htmlContent = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf-8") : "";
      const textContent = fs.existsSync(textPath) ? fs.readFileSync(textPath, "utf-8") : "";

      html = htmlContent ? ejs.render(htmlContent, data) : undefined;
      text = textContent ? ejs.render(textContent, data) : undefined;
    } else {
      html = data.html || undefined;
      text = data.text || undefined;
    }

    const info = await transporter.sendMail({
      from: commonConfig?.params?.senderEmail || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}
