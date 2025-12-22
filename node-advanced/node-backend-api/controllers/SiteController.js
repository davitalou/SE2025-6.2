import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Op } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

import { User } from "../models/User.js";
import { sendMail } from "../../node-common/utils/mailer.js";

const buildToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "2h" });

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  status: user.status,
  created_at: user.created_at,
  updated_at: user.updated_at
});

/* HOME */
export const index = (req, res) => {
  res.json({ success: true, message: "Home endpoint", user: req.user || null });
};

/* ABOUT */
export const showAboutPage = (req, res) => {
  res.json({ success: true, message: "About endpoint" });
};

/* CONTACT */
export const showContactPage = (req, res) => {
  res.json({ success: true, message: "Contact endpoint" });
};

/* LOGIN PAGE (info only) */
export const showLoginPage = (_req, res) => {
  res.json({ success: true, message: "Login endpoint. POST credentials to login." });
};

/* LOGIN PROCESS */
export const login = async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body;

    // identifier allows login with either username or email in one field
    const loginField = identifier || username || email;

    if (!loginField || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter username/email and password" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: loginField }, { email: loginField }]
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Sai ten dang nhap hoac mat khau" });
    }

    if (user.status !== 10) {
      return res.status(403).json({ success: false, message: "Chua xac thuc email" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Sai ten dang nhap hoac mat khau" });
    }

    const token = buildToken(user);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* LOGOUT */
export const logout = (_req, res) => {
  res.json({ success: true, message: "Logged out" });
};

/* REGISTER PAGE (info only) */
export const showRegisterPage = (_req, res) => {
  res.json({ success: true, message: "Register endpoint. POST data to register." });
};

/* REGISTER PROCESS */
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existEmail = await User.findOne({ where: { email } });
    if (existEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const existUser = await User.findOne({ where: { username } });
    if (existUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      username,
      email,
      password_hash: password,
      status: 0,
      verification_token: token
    });

    await sendMail({
      to: email,
      subject: "Verify your email",
      data: {
        html: `<a href="${req.protocol}://${req.get("host")}/api/site/verify-email?token=${token}">Verify Email</a>`
      }
    });

    res.status(201).json({
      success: true,
      message: "Signup successful! Check your email to verify.",
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

/* VERIFY EMAIL */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ where: { verification_token: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid link" });
    }

    user.status = 10;
    user.verification_token = null;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully!",
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

/* RESEND VERIFY EMAIL PAGE (info) */
export const showResendVerifyPage = (_req, res) => {
  res.json({ success: true, message: "Resend verification endpoint. POST email to resend." });
};

/* RESEND VERIFY EMAIL PROCESS */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email, status: 0 } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email not found or already verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.verification_token = token;
    await user.save();

    await sendMail({
      to: email,
      subject: "Verify Email",
      data: {
        html: `Click link: <a href="${req.protocol}://${req.get("host")}/api/site/verify-email?token=${token}">Verify</a>`
      }
    });

    res.json({ success: true, message: "Verification email resent" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to resend verification email" });
  }
};

/* FORGOT PASSWORD PAGE (info) */
export const showForgotPasswordPage = (_req, res) => {
  res.json({ success: true, message: "Request password reset endpoint. POST email to request." });
};

/* FORGOT PASSWORD PROCESS */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // Generate a new password immediately and email it
    const newPassword = crypto.randomBytes(6).toString("base64"); // ~8 chars
    user.password_hash = newPassword;
    user.password_reset_token = null;
    await user.save();

    await sendMail({
      to: email,
      subject: "Reset password thành công",
      data: {
        html: `<p>Reset password thành công. Password mới của bạn là: <strong>${newPassword}</strong></p>`
      }
    });

    res.json({ success: true, message: "Password reset successful", password: newPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to request password reset" });
  }
};

/* RESET PASSWORD PAGE (info) */
export const showResetPasswordPage = (req, res) => {
  res.status(400).json({
    success: false,
    message: "Link reset không còn sử dụng. Vui lòng dùng chức năng Quên mật khẩu để nhận mật khẩu mới."
  });
};

/* RESET PASSWORD PROCESS */
export const resetPassword = async (req, res) => {
  try {
    let { password } = req.body;
    const token = req.params.token;

    const user = await User.findOne({ where: { password_reset_token: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // If client does not provide a password, generate one and return/log it.
    if (!password) {
      password = crypto.randomBytes(6).toString("base64"); // ~8 chars
    }

    user.password_hash = password;
    user.password_reset_token = null;
    await user.save();

    console.log(`New password: ${password}`);

    // Send confirmation email with the new password
    try {
      await sendMail({
        to: user.email,
        subject: "Reset password thành công",
        data: {
          html: `<p>Reset password thành công.</p><p>Password mới của bạn là: <strong>${password}</strong></p>`
        }
      });
    } catch (mailErr) {
      console.error("Failed to send reset confirmation email", mailErr);
    }

    res.json({
      success: true,
      message: "Password reset successful",
      password
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot reset password" });
  }
};

/* CURRENT USER */
export const currentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  res.json({ success: true, user: req.user });
};

/* PROFILE - GET */
export const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, user: sanitizeUser(user) });
};

/* PROFILE - UPDATE */
export const updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  try {
    const { username, email, password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (username) {
      const existUser = await User.findOne({ where: { username } });
      if (existUser && existUser.id !== user.id) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
      user.username = username;
    }

    if (email) {
      const existEmail = await User.findOne({ where: { email } });
      if (existEmail && existEmail.id !== user.id) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      user.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      user.password_hash = password;
    }

    await user.save();
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/* CHANGE PASSWORD (AUTH) */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Incorrect old password" });
    }
    user.password_hash = newPassword;
    await user.save();
    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

/* CONTACT */
export const contact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    await sendMail({
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: subject,
      data: {
        html: `
          <p>New contact message from ${name} (${email})</p>
          <p>Subject: ${subject}</p>
          <p>${message}</p>
        `
      }
    });
    res.json({ success: true, message: "Thank you for contacting us. We will respond soon." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

/* ERROR PAGE */
export const showErrorPage = (_req, res) => {
  res.status(500).json({ success: false, message: "Something went wrong" });
};
