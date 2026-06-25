import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

export const protect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "No token, not authorized" });
  }
};

// Optional auth — sets req.user if a valid Bearer token is present, otherwise continues
export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      // Invalid token — proceed as unauthenticated
    }
  }
  next();
};

// SSE variant — accepts a short-lived one-time nonce (never a long-lived JWT in query string)
// Nonces are issued by POST /api/notifications/sse-token and expire after 60s
export const protectNonce = (nonceStore) => async (req, res, next) => {
  const nonce = req.query.nonce;
  if (!nonce) return res.status(401).json({ message: "No nonce, not authorized" });

  const entry = nonceStore.get(nonce);
  if (!entry || Date.now() > entry.expiresAt) {
    nonceStore.delete(nonce);
    return res.status(401).json({ message: "Nonce expired or invalid" });
  }

  // One-time use — delete immediately
  nonceStore.delete(nonce);

  const user = await User.findById(entry.userId).select("-password");
  if (!user) return res.status(401).json({ message: "User not found" });

  req.user = user;
  next();
};
