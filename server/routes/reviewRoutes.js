import express from "express";
import Review from "../models/Review.js";
import { protect } from "../middleware/authMiddleware.js";
import { sanitizeText } from "../utils/validators.js";

const router = express.Router();

const serializeReview = (review) => ({
  _id: review._id,
  movieId: review.movieId,
  content: review.content,
  rating: review.rating || null,
  author: review.author || review.user?.name || "Anonymous",
  user: review.user?._id || review.user,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

// Get reviews for a movie
router.get("/:movieId", async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(reviews.map(serializeReview));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get average CineWorld rating for a movie
router.get("/:movieId/rating", async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { movieId: req.params.movieId, rating: { $ne: null } } },
      {
        $group: {
          _id: "$movieId",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          distribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    if (!result.length) {
      return res.json({ avgRating: null, totalRatings: 0, distribution: {} });
    }

    // Count each star (1-5)
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].distribution.forEach(r => { if (dist[r] !== undefined) dist[r]++; });

    res.json({
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      totalRatings: result[0].totalRatings,
      distribution: dist,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add review with optional rating
router.post("/", protect, async (req, res) => {
  try {
    const movieId = sanitizeText(req.body.movieId, 40);
    const content = sanitizeText(req.body.content, 1000);
    const rating = req.body.rating ? Number(req.body.rating) : null;

    if (!movieId || content.length < 2) {
      return res.status(400).json({ message: "Movie id and review text are required" });
    }

    if (rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = new Review({
      movieId,
      user: req.user._id,
      author: req.user.name,
      content,
      rating,
    });
    await review.save();
    res.status(201).json(serializeReview(review));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete review
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own review" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;