import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Verify JWT token
export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    logger.warn("Admin auth failed", { error: err.message });
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    logger.warn("Unauthorized admin access", { userId: req.user?._id });
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Check if user is moderator or admin
export const isModerator = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "moderator") {
    logger.warn("Unauthorized moderator access", { userId: req.user?._id });
    return res.status(403).json({ message: "Moderator access required" });
  }
  next();
};
