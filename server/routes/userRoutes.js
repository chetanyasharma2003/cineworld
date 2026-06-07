import express from "express";
import Review from "../models/Review.js";
import { protect } from "../middleware/authMiddleware.js";
import { sanitizeMovieForList } from "../utils/validators.js";

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
    if (email) req.user.email = email.trim().toLowerCase();

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
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;