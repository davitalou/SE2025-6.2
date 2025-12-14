import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Please enter username and password" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.status !== 10) {
      return res.status(403).json({ success: false, message: "Email not verified" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
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

    const token = crypto.randomBytes(32).toString("hex");
    user.password_reset_token = token;
    await user.save();

    await sendMail({
      to: email,
      subject: "Reset Password",
      data: {
        html: `Click link to reset: <a href="${req.protocol}://${req.get("host")}/api/site/reset-password/${token}">Reset</a>`
      }
    });

    res.json({ success: true, message: "Password reset email sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to request password reset" });
  }
};

/* RESET PASSWORD PAGE (info) */
export const showResetPasswordPage = (req, res) => {
  res.json({
    success: true,
    message: "Reset password endpoint. POST new password.",
    token: req.params.token
  });
};

/* RESET PASSWORD PROCESS */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token;

    const user = await User.findOne({ where: { password_reset_token: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    user.password_hash = password;
    user.password_reset_token = null;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
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
