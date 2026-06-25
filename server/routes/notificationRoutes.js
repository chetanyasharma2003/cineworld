import crypto from "crypto";
import express from "express";
import Notification from "../models/Notification.js";
import { protect, protectNonce } from "../middleware/authMiddleware.js";
import { registerSseClient, unregisterSseClient, notifyUser } from "../utils/notifyUser.js";
export { notifyUser };

const router = express.Router();

// ── One-time SSE nonce store ───────────────────────────────────────────────────
// nonce → { userId, expiresAt }  (60 second TTL, single use)
const sseNonces = new Map();

// Purge expired nonces every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sseNonces) {
    if (now > v.expiresAt) sseNonces.delete(k);
  }
}, 120_000);

// POST /api/notifications/sse-token — exchange Bearer JWT for a short-lived nonce
router.post("/sse-token", protect, (req, res) => {
  const nonce = crypto.randomBytes(32).toString("hex");
  sseNonces.set(nonce, {
    userId: String(req.user._id),
    expiresAt: Date.now() + 60_000, // 60 seconds
  });
  res.json({ nonce });
});

// GET /api/notifications/stream?nonce=xxx — SSE stream (nonce replaces JWT in query)
router.get("/stream", protectNonce(sseNonces), (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const userId = req.user._id;
  registerSseClient(userId, res);

  // Heartbeat every 30s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch {}
  }, 30_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregisterSseClient(userId, res);
  });
});

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/mark-read — mark all as read
router.post("/mark-read", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/mark-read/:id
router.post("/mark-read/:id", protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications — clear all
router.delete("/", protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
