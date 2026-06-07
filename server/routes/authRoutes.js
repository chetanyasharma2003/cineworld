import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { protect } from "../middleware/authMiddleware.js";
import { isValidEmail, normalizeEmail, sanitizeText, validatePassword } from "../utils/validators.js";

const router = express.Router();

const createToken = (user) => jwt.sign({ id: user._id, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

// Signup
router.post("/signup", async (req, res) => {
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

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({ user: publicUser(user), token: createToken(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    res.json({ user: publicUser(user), token: createToken(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
