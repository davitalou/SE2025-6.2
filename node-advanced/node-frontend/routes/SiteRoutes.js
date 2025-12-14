import express from "express";
import {
  index,
  showAboutPage,
  showContactPage,

  showLoginPage,
  login,
  logout,

  showRegisterPage,
  register,

  verifyEmail,
  showResendVerifyPage,
  resendVerificationEmail,

  showForgotPasswordPage,
  requestPasswordReset,

  showResetPasswordPage,
  resetPassword,

  showErrorPage,
  contact
} from "../controllers/SiteController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Home
router.get("/", index);

// Pages
router.get("/about", showAboutPage);
router.get("/contact", showContactPage);
router.post("/contact", contact);

// Auth
router.get("/login", showLoginPage);
router.post("/login", login);
router.post("/logout", verifyToken, logout);

router.get("/register", showRegisterPage);
router.post("/register", register);

// Email Verification
router.get("/verify-email", verifyEmail);

router.get("/resend-verification", showResendVerifyPage);
router.post("/resend-verification", resendVerificationEmail);

// Forgot Password
router.get("/forgot-password", showForgotPasswordPage);
router.post("/forgot-password", requestPasswordReset);

// Reset Password
router.get("/reset-password/:token", showResetPasswordPage);
router.post("/reset-password/:token", resetPassword);

// Error
router.get("/error", showErrorPage);

export default router;
