import express from "express";
import {
  index,
  showLoginPage,
  login,
  logout,
  showErrorPage,
  sendVerificationEmail,
  showRegisterPage,
  register,
} from "../controllers/SiteController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", index);
router.get("/login", showLoginPage);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/send-verification", sendVerificationEmail);
router.get("/error", showErrorPage);
router.get("/register", showRegisterPage);
router.post("/register", register);

export default router;
