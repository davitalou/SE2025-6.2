import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001/api/site";

const buildApiUrl = (path = "") => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const callApi = async (path, { method = "GET", body, token } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const getToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.replace("Bearer ", "");
  return null;
};

const decodeUser = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
};

/* HOME */
export const index = (req, res) => {
  res.render("site/index", {
    title: "Home",
    layout: "layouts/main",
    user: res.locals.user
  });
};

/* ABOUT */
export const showAboutPage = (req, res) => {
  res.render("site/about", {
    title: "About",
    layout: "layouts/main",
    user: res.locals.user
  });
};

/* CONTACT */
export const showContactPage = (req, res) => {
  res.render("site/contact", {
    title: "Contact",
    layout: "layouts/main",
    user: res.locals.user,
    alert: null,
    formData: { name: "", email: "", subject: "", message: "" }
  });
};

/* LOGIN PAGE */
export const showLoginPage = (req, res) => {
  res.render("site/login", {
    title: "Login",
    layout: "layouts/blank",
    alert: null,
    oldUsername: ""
  });
};

/* LOGIN PROCESS */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.render("site/login", {
        title: "Login",
        layout: "layouts/blank",
        alert: { type: "warning", message: "Please enter username and password" },
        oldUsername: username
      });
    }

    const { ok, data } = await callApi("/login", { method: "POST", body: { username, password } });
    if (!ok || !data?.success) {
      return res.render("site/login", {
        title: "Login",
        layout: "layouts/blank",
        alert: { type: "danger", message: data?.message || "Login failed" },
        oldUsername: username
      });
    }

    const token = data.token;
    if (token) {
      res.cookie("token", token, { httpOnly: true });
      res.locals.user = decodeUser(token) || data.user || null;
    }

    res.render("site/index", {
      title: "Home",
      layout: "layouts/main",
      alert: { type: "success", message: data?.message || "Login successful!" },
      user: res.locals.user
    });
  } catch (err) {
    console.log(err);
    res.render("site/error", {
      title: "Error",
      message: "Login failed",
      layout: "layouts/blank"
    });
  }
};

/* LOGOUT */
export const logout = async (req, res) => {
  try {
    const token = getToken(req);
    await callApi("/logout", { method: "POST", token });
  } catch (e) {
    // ignore
  }
  res.clearCookie("token");
  res.render("site/login", {
    title: "Login",
    layout: "layouts/blank",
    alert: { type: "info", message: "You have logged out" }
  });
};

/* REGISTER PAGE */
export const showRegisterPage = (req, res) => {
  res.render("site/register", {
    title: "Signup",
    layout: "layouts/blank",
    alert: null,
    oldData: { username: "", email: "" }
  });
};

/* REGISTER PROCESS */
export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      return res.render("site/register", {
        title: "Signup",
        layout: "layouts/blank",
        alert: { type: "warning", message: "Please fill all fields" },
        oldData: { username, email }
      });
    }

    const { ok, data } = await callApi("/register", {
      method: "POST",
      body: { username, email, password, confirmPassword }
    });

    if (!ok || !data?.success) {
      return res.render("site/register", {
        title: "Signup",
        layout: "layouts/blank",
        alert: { type: "danger", message: data?.message || "Registration failed" },
        oldData: { username, email }
      });
    }

    res.render("site/login", {
      title: "Login",
      layout: "layouts/blank",
      alert: { type: "info", message: data?.message || "Signup successful! Check your email" }
    });
  } catch (err) {
    console.log(err);
    res.render("site/error", {
      title: "Error",
      message: "Registration failed",
      layout: "layouts/blank"
    });
  }
};

/* CONTACT PROCESS */
export const contact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  const formData = { name, email, subject, message };
  try {
    if (!name || !email || !subject || !message) {
      return res.render("site/contact", {
        title: "Contact",
        layout: "layouts/main",
        user: res.locals.user,
        alert: { type: "warning", message: "Please fill all fields" },
        formData
      });
    }

    const { ok, data } = await callApi("/contact", {
      method: "POST",
      body: { name, email, subject, message }
    });

    if (!ok || !data?.success) {
      return res.render("site/contact", {
        title: "Contact",
        layout: "layouts/main",
        user: res.locals.user,
        alert: { type: "danger", message: data?.message || "Failed to send message" },
        formData
      });
    }

    return res.render("site/contact", {
      title: "Contact",
      layout: "layouts/main",
      user: res.locals.user,
      alert: { type: "success", message: data?.message || "Message sent" },
      formData: { name: "", email: "", subject: "", message: "" }
    });
  } catch (err) {
    return res.render("site/contact", {
      title: "Contact",
      layout: "layouts/main",
      user: res.locals.user,
      alert: { type: "danger", message: "Failed to send message" },
      formData
    });
  }
};

/* VERIFY EMAIL */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const { ok, data } = await callApi(`/verify-email?token=${token || ""}`);
    if (!ok || !data?.success) {
      return res.render("site/error", {
        title: "Error",
        message: data?.message || "Invalid link",
        layout: "layouts/blank"
      });
    }

    res.render("site/verify-success", {
      title: "Verified!",
      layout: "layouts/blank",
      message: data?.message || "Email verified successfully!"
    });
  } catch (err) {
    res.render("site/error", {
      title: "Error",
      message: "Verification failed",
      layout: "layouts/blank"
    });
  }
};

/* RESEND VERIFY EMAIL PAGE */
export const showResendVerifyPage = (req, res) => {
  res.render("site/resendVerificationEmail", {
    title: "Resend Verification Email",
    layout: "layouts/blank",
    alert: null
  });
};

/* RESEND VERIFY EMAIL PROCESS */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const { ok, data } = await callApi("/resend-verification", {
      method: "POST",
      body: { email }
    });

    if (!ok || !data?.success) {
      return res.render("site/resendVerificationEmail", {
        title: "Resend Verification Email",
        layout: "layouts/blank",
        alert: { type: "danger", message: data?.message || "Email not found" }
      });
    }

    res.render("site/login", {
      title: "Login",
      layout: "layouts/blank",
      alert: { type: "info", message: data?.message || "Email sent!" }
    });
  } catch (err) {
    res.render("site/error", {
      title: "Error",
      message: "Failed to resend",
      layout: "layouts/blank"
    });
  }
};

/* FORGOT PASSWORD PAGE */
export const showForgotPasswordPage = (req, res) => {
  res.render("site/requestPasswordReset", {
    title: "Request Password Reset",
    layout: "layouts/blank",
    alert: null
  });
};

/* FORGOT PASSWORD PROCESS */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const { ok, data } = await callApi("/forgot-password", {
      method: "POST",
      body: { email }
    });

    if (!ok || !data?.success) {
      return res.render("site/requestPasswordReset", {
        title: "Request Password Reset",
        layout: "layouts/blank",
        alert: { type: "danger", message: data?.message || "Email not found" }
      });
    }

    res.render("site/login", {
      title: "Login",
      layout: "layouts/blank",
      alert: { type: "info", message: data?.message || "Check your email" }
    });
  } catch (err) {
    res.render("site/error", {
      title: "Error",
      message: "Failed",
      layout: "layouts/blank"
    });
  }
};

/* RESET PASSWORD PAGE */
export const showResetPasswordPage = (req, res) => {
  res.render("site/resetPassword", {
    title: "Reset Password",
    layout: "layouts/blank",
    token: req.params.token,
    alert: null
  });
};

/* RESET PASSWORD PROCESS */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token;

    const { ok, data } = await callApi(`/reset-password/${token}`, {
      method: "POST",
      body: { password }
    });

    if (!ok || !data?.success) {
      return res.render("site/error", {
        title: "Error",
        message: data?.message || "Invalid token",
        layout: "layouts/blank"
      });
    }

    res.render("site/login", {
      title: "Login",
      layout: "layouts/blank",
      alert: { type: "success", message: data?.message || "Password reset successful!" }
    });
  } catch (err) {
    res.render("site/error", {
      title: "Error",
      message: "Cannot reset password",
      layout: "layouts/blank"
    });
  }
};

/* ERROR PAGE */
export const showErrorPage = (req, res) => {
  res.render("site/error", {
    title: "Error",
    message: "Something went wrong",
    layout: "layouts/main"
  });
};
