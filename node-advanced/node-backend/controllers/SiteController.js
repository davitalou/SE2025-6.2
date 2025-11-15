import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import { sendMail } from "../../node-common/utils/mailer.js";

dotenv.config();

/**
 * Trang chủ
 */
export const index = (req, res) => {
  try {
    res.render("site/index", {
      title: "Trang chủ",
      layout: "layouts/main",
      user: req.user || null,
    });
  } catch (err) {
    console.error("Error rendering index:", err);
    res.render("site/error", {
      title: "Lỗi",
      message: "Không thể hiển thị trang chủ.",
      layout: "layouts/main",
    });
  }
};

/**
 * Hiển thị trang đăng nhập
 */
export const showLoginPage = (req, res) => {
  res.render("site/login", {
    title: "Đăng nhập",
    layout: "layouts/blank",
    alert: null,
  });
};

/**
 * Xử lý đăng nhập
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra đầu vào
    if (!username || !password) {
      return res.render("site/login", {
        title: "Đăng nhập",
        layout: "layouts/blank",
        alert: { type: "warning", message: "Vui lòng nhập đầy đủ tên và mật khẩu." },
      });
    }

    // Tìm user trong DB
    console.log("Checking user:", username);
    const user = await User.findOne({ where: { username } });
    console.log("Found:", user);

    if (!user) {
      return res.render("site/login", {
        title: "Đăng nhập",
        layout: "layouts/blank",
        alert: { type: "danger", message: "Không tìm thấy người dùng." },
      });
    }

    // So sánh mật khẩu (sử dụng đúng cột `password_hash`)
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render("site/login", {
        title: "Đăng nhập",
        layout: "layouts/blank",
        alert: { type: "danger", message: "Sai tên đăng nhập hoặc mật khẩu." },
      });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || "secret_key_123",
      { expiresIn: "2h" }
    );

    // Nếu request là JSON (API client)
    if (req.headers["accept"] === "application/json") {
      return res.json({
        success: true,
        message: "Đăng nhập thành công!",
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    }

    // Nếu đăng nhập qua form web
    res.render("site/index", {
      title: "Trang chủ",
      layout: "layouts/main",
      alert: { type: "success", message: "Đăng nhập thành công!" },
      user: { username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.render("site/error", {
      title: "Lỗi",
      message: "Đăng nhập thất bại, vui lòng thử lại sau.",
      layout: "layouts/main",
    });
  }
};

/**
 * Đăng xuất
 */
export const logout = (req, res) => {
  try {
    // Không dùng session → chỉ trả thông báo
    if (req.headers["accept"] === "application/json") {
      return res.json({ success: true, message: "Đã đăng xuất thành công." });
    }
    res.render("site/login", {
      title: "Đăng nhập",
      layout: "layouts/blank",
      alert: { type: "info", message: "Bạn đã đăng xuất." },
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.render("site/error", {
      title: "Lỗi",
      message: "Đăng xuất thất bại.",
      layout: "layouts/main",
    });
  }
};

/**
 * Trang lỗi chung
 */
export const showErrorPage = (req, res) => {
  res.render("site/error", {
    title: "Lỗi",
    message: "Đã xảy ra lỗi không mong muốn.",
    layout: "layouts/main",
  });
};

/**
 * Gửi email xác thực tài khoản
 */
export const sendVerificationEmail = async (req, res) => {
  try {
    const { email, token } = req.body;
    const verifyLink = `${req.protocol}://${req.get("host")}/api/site/verify-email?token=${token}`;
    const html = `
      <p>Xin chào,</p>
      <p>Nhấn vào liên kết sau để xác thực tài khoản của bạn:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
    `;

    await sendMail(email, "Xác thực tài khoản", html);

    res.json({ success: true, message: "Email xác thực đã được gửi." });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ success: false, message: "Gửi email thất bại." });
  }
};

/**
 * Hiển thị trang đăng ký
 */
export const showRegisterPage = (req, res) => {
  res.render("site/register", {
    title: "Register",
    layout: "layouts/blank",
    alert: null,
  });
};

/**
 * Xử lý đăng ký tài khoản mới
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    console.log("Form data:", req.body);

    if (!username || !email || !password || !confirmPassword) {
      return res.render("site/error", {
        title: "Error",
        message: "Please fill in all fields.",
        layout: "layouts/main",
      });
    }

    if (password !== confirmPassword) {
      return res.render("site/error", {
        title: "Error",
        message: "Passwords do not match.",
        layout: "layouts/main",
      });
    }

    // Kiểm tra user tồn tại
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render("site/error", {
        title: "Error",
        message: "Username already exists.",
        layout: "layouts/main",
      });
    }

    // Tạo user mới
    await User.create({
      username,
      email,
      password_hash: password, // hook tự hash
      status: 10,
    });

    res.render("site/login", {
      title: "Login",
      layout: "layouts/blank",
      alert: { type: "success", message: "Registration successful! Please login." },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.render("site/error", {
      title: "Error",
      message: `Registration failed: ${err.message}`,
      layout: "layouts/main",
    });
  }
};
