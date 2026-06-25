import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { protect } from "../middleware/authMiddleware.js";
import { isValidEmail, normalizeEmail, sanitizeText, validatePassword } from "../utils/validators.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer.js";
import Notification from "../models/Notification.js";
import { notifyUser } from "./notificationRoutes.js";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/authSchemas.js";

const router = express.Router();

const createAccessToken  = (user) => jwt.sign({ id: user._id, name: user.name }, env.JWT_SECRET, { expiresIn: "15m" });
const createRefreshToken = (user) => jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,   // alias for client code that uses either field
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || null,
  emailVerified: user.emailVerified || false,
  createdAt: user.createdAt,
});

// Signup
router.post("/signup", validate(signupSchema), async (req, res) => {
  try {
    const name = sanitizeText(req.body.name, 80);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "An account with this email already exists" });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const user = new User({
      name, email, password,
      emailVerified: false,
      emailVerifyToken: crypto.createHash("sha256").update(verifyToken).digest("hex"),
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${verifyToken}`;
    try { await sendVerificationEmail(email, name, verifyUrl); } catch {}

    // Welcome notification
    const welcomeNotif = await Notification.create({ user: user._id, icon: "🎬", text: `Welcome to CineWorld, ${name}! Start browsing movies and building your watchlist.`, link: "/" });
    notifyUser(user._id, welcomeNotif);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: publicUser(user), token: createAccessToken(user), emailVerificationSent: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    // Account lockout check
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.` });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incLoginAttempts();
      const remaining = Math.max(0, 5 - (user.loginAttempts + 1));
      const msg = remaining > 0
        ? `Invalid email or password. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
        : "Invalid email or password. Account locked for 15 minutes.";
      return res.status(401).json({ message: msg });
    }

    // Successful login — reset counter
    await user.resetLoginAttempts();

    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: publicUser(user), token: createAccessToken(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Refresh access token — with token rotation (old token invalidated on each use)
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      // Token reuse detected — clear stored token to force re-login
      if (user) { user.refreshToken = null; await user.save(); }
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    // Rotate: issue new refresh token, invalidate old one
    const newRefreshToken = createRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ token: createAccessToken(user) });
  } catch {
    res.clearCookie("refreshToken");
    res.status(401).json({ message: "Refresh token expired, please login again" });
  }
});

// Logout — clear refresh token
router.post("/logout", protect, async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

// Verify email
router.get("/verify-email", async (req, res) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.query.token || "").digest("hex");
    const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Verification link is invalid or has expired" });
    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();
    res.json({ message: "Email verified successfully. You can now use all features." });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
});

// Resend verification email
router.post("/resend-verification", protect, async (req, res) => {
  try {
    if (req.user.emailVerified) return res.status(400).json({ message: "Email is already verified" });
    const verifyToken = crypto.randomBytes(32).toString("hex");
    req.user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
    req.user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await req.user.save();
    const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(req.user.email, req.user.name, verifyUrl);
    res.json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

// Forgot password
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If that email exists, a reset link was sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reset email" });
  }
});

// Reset password
router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.body.token || "").digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Reset token is invalid or has expired" });

    const passwordError = validatePassword(req.body.password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    user.password = req.body.password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
});

export default router;
