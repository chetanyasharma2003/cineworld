import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { sanitizeMovieForList, sanitizeMovieForWatchlist, WATCHLIST_STATUSES } from "../utils/validators.js";
import { computeTasteVector, cosineSimilarity } from "../services/aiService.js";
import { sendVerificationEmail } from "../utils/mailer.js";
import { env } from "../config/env.js";
import { notifyUser } from "../utils/notifyUser.js";

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user._id}${ext}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = express.Router();

// Get my list
router.get("/me/list", protect, (req, res) => {
  res.json({ movies: req.user.savedMovies || [] });
});

// Add to my list
router.post("/me/list", protect, async (req, res) => {
  try {
    const movie = sanitizeMovieForList(req.body.movie);
    const current = req.user.savedMovies || [];
    const exists = current.some((item) => item.id === movie.id);
    req.user.savedMovies = exists
      ? current.map((item) => (item.id === movie.id ? movie : item))
      : [movie, ...current];
    await req.user.save();
    res.status(201).json({ movies: req.user.savedMovies });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove from my list
router.delete("/me/list/:movieId", protect, async (req, res) => {
  const movieId = Number(req.params.movieId);
  req.user.savedMovies = (req.user.savedMovies || []).filter((m) => m.id !== movieId);
  await req.user.save();
  res.json({ movies: req.user.savedMovies });
});

// ─── Watchlist ────────────────────────────────────────────────────────────────

// Get watchlist
router.get("/me/watchlist", protect, (req, res) => {
  res.json({ movies: req.user.watchlist || [] });
});

// Add / update watchlist entry
router.post("/me/watchlist", protect, async (req, res) => {
  try {
    const movie = sanitizeMovieForWatchlist(req.body.movie, req.body.status);
    const current = req.user.watchlist || [];
    const exists = current.some((item) => item.id === movie.id);
    req.user.watchlist = exists
      ? current.map((item) => (item.id === movie.id ? movie : item))
      : [movie, ...current];
    await req.user.save();
    res.status(201).json({ movies: req.user.watchlist });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update status of a watchlist entry
router.put("/me/watchlist/:movieId", protect, async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    const { status } = req.body;
    if (!WATCHLIST_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${WATCHLIST_STATUSES.join(", ")}` });
    }
    const current = req.user.watchlist || [];
    const item = current.find((m) => m.id === movieId);
    if (!item) return res.status(404).json({ message: "Movie not in watchlist" });
    item.status = status;
    req.user.markModified("watchlist");
    await req.user.save();
    res.json({ movies: req.user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove from watchlist
router.delete("/me/watchlist/:movieId", protect, async (req, res) => {
  const movieId = Number(req.params.movieId);
  req.user.watchlist = (req.user.watchlist || []).filter((m) => m.id !== movieId);
  await req.user.save();
  res.json({ movies: req.user.watchlist });
});

// ✅ NEW — Get my reviews
router.get("/me/reviews", protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW — Update profile (name, email, password)
router.put("/me", protect, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    if (name) req.user.name = name.trim();

    // Email change — mark as unverified and send new verification
    if (email && email.trim().toLowerCase() !== req.user.email) {
      const newEmail = email.trim().toLowerCase();
      const exists = await User.findOne({ email: newEmail, _id: { $ne: req.user._id } });
      if (exists) return res.status(409).json({ message: "That email is already in use" });
      req.user.email = newEmail;
      req.user.emailVerified = false;
      const verifyToken = crypto.randomBytes(32).toString("hex");
      req.user.emailVerifyToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
      req.user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const verifyUrl = `${env.CLIENT_ORIGIN}/verify-email?token=${verifyToken}`;
      try { await sendVerificationEmail(newEmail, req.user.name, verifyUrl); } catch {}
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password required" });
      const isMatch = await req.user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      req.user.password = newPassword;
    }

    await req.user.save();
    res.json({
      user: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        avatarUrl: req.user.avatarUrl || null,
        createdAt: req.user.createdAt,
      },
      emailVerificationSent: !req.user.emailVerified,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Delete Account ───────────────────────────────────────────────────────────
router.delete("/me", protect, async (req, res) => {
  try {
    await Review.deleteMany({ user: req.user._id });
    await req.user.deleteOne();
    res.clearCookie("refreshToken");
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Avatar Upload ────────────────────────────────────────────────────────────
router.post("/me/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const avatarUrl = `/uploads/${req.file.filename}`;
    req.user.avatarUrl = avatarUrl;
    await req.user.save();
    res.json({
      user: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        avatarUrl: req.user.avatarUrl,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/users/collab-picks
 * Collaborative filtering: find users with similar taste vectors,
 * return movies from their watchlists that the current user hasn't saved.
 * Returns up to 20 recommendations.
 */
router.get("/collab-picks", protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select("watchlist tasteVector");
    if (!me?.watchlist?.length || me.watchlist.length < 3) {
      return res.json({ picks: [], reason: "Add at least 3 movies to your watchlist to get collaborative picks." });
    }

    // Compute taste vector — persist if freshly computed
    let myVector;
    if (me.tasteVector?.size) {
      myVector = Object.fromEntries(me.tasteVector);
    } else {
      myVector = computeTasteVector(me.watchlist);
      if (Object.keys(myVector).length) {
        await User.findByIdAndUpdate(req.user._id, { tasteVector: myVector });
      }
    }

    const myIds = new Set(me.watchlist.map(m => String(m.id)));

    // Find other users who have watchlist items (tasteVector checked in-memory)
    const others = await User.find({
      _id: { $ne: req.user._id },
      "watchlist.3": { $exists: true }, // at least 4 items (index 3 exists)
    }).select("watchlist tasteVector").lean().limit(500);

    const withVector = others;

    if (!withVector.length) {
      return res.json({ picks: [], reason: "Not enough users with watchlists yet." });
    }

    // Score each user by cosine similarity of taste vectors
    const myVec = Object.entries(myVector).map(([, v]) => v);
    const allGenreKeys = Object.keys(myVector);

    const scored = withVector.map(u => {
      const uMap = u.tasteVector instanceof Map
        ? Object.fromEntries(u.tasteVector)
        : (u.tasteVector || {});
      const uVec = allGenreKeys.map(k => uMap[k] || 0);
      const similarity = myVec.length && uVec.length
        ? cosineSimilarity(myVec, uVec)
        : 0;
      return { user: u, similarity };
    });

    // Take top 10 similar users
    const topUsers = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .filter(s => s.similarity > 0.3);

    if (!topUsers.length) {
      return res.json({ picks: [], reason: "No similar users found yet." });
    }

    // Collect movies from their watchlists that current user hasn't saved
    const movieScores = {};
    for (const { user: u, similarity } of topUsers) {
      for (const movie of (u.watchlist || [])) {
        const key = String(movie.id);
        if (myIds.has(key)) continue;
        if (!movieScores[key]) movieScores[key] = { movie, score: 0, count: 0 };
        movieScores[key].score += similarity;
        movieScores[key].count++;
      }
    }

    const picks = Object.values(movieScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ movie, count }) => ({ ...movie, _collaborators: count }));

    res.json({ picks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Social ───────────────────────────────────────────────────────────────────

// Get my social stats + following list
router.get("/me/social", protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .select("following")
      .populate("following", "name avatarUrl watchlist createdAt")
      .lean();

    const followerCount = await User.countDocuments({ following: req.user._id });

    const following = (me.following || []).map(u => ({
      _id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl || null,
      watchlistCount: u.watchlist?.length || 0,
      recentWatchlist: (u.watchlist || []).slice(0, 6),
    }));

    res.json({ following, followerCount, followingCount: following.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Social: Follow / Unfollow ────────────────────────────────────────────────

// Toggle weekly digest opt-out
router.post("/me/digest-opt-out", protect, async (req, res) => {
  try {
    req.user.digestOptOut = !req.user.digestOptOut;
    await req.user.save();
    res.json({ digestOptOut: req.user.digestOptOut });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow a user
router.post("/:userId/follow", protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (targetId === String(req.user._id)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = req.user.following.some(id => id.toString() === targetId);
    if (!alreadyFollowing) {
      req.user.following.push(target._id);
      await req.user.save();

      // Notify the followed user
      const notif = await Notification.create({
        user: target._id,
        text: `${req.user.name} started following you`,
        icon: "👥",
        link: `/user/${req.user._id}`,
      });
      notifyUser(target._id, notif);
    }
    const followerCount = await User.countDocuments({ following: target._id });
    res.json({ following: true, followerCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unfollow a user
router.delete("/:userId/follow", protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    req.user.following = req.user.following.filter(id => id.toString() !== targetId);
    await req.user.save();
    const followerCount = await User.countDocuments({ following: targetId });
    res.json({ following: false, followerCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public profile — includes isFollowedBy so client doesn't need a second request
router.get("/:userId/profile", optionalProtect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(targetId)
      .select("name avatarUrl watchlist following createdAt")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const followerCount = await User.countDocuments({ following: user._id });

    // Check follow status without a second round-trip on the client
    const isFollowedBy = req.user
      ? !!(await User.exists({ _id: req.user._id, following: user._id }))
      : false;

    res.json({
      _id: user._id,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
      watchlistCount: user.watchlist?.length || 0,
      followingCount: user.following?.length || 0,
      followerCount,
      isFollowedBy,
      recentWatchlist: (user.watchlist || []).slice(0, 12),
      joinedAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;