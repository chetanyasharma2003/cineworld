import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { sanitizeText } from "../utils/validators.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema, editReviewSchema } from "../schemas/reviewSchemas.js";
import { moderateReview } from "../services/aiService.js";

const router = express.Router();

const serializeReview = (review, requestUserId) => ({
  _id: review._id,
  movieId: review.movieId,
  movieTitle: review.movieTitle || "",
  content: review.content,
  rating: review.rating || null,
  author: review.author || review.user?.name || "Anonymous",
  user: review.user?._id || review.user,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  helpfulCount: review.helpful?.length || 0,
  helpfulByMe: requestUserId
    ? (review.helpful || []).some(id => id.toString() === requestUserId.toString())
    : false,
});

/**
 * @openapi
 * /reviews/{movieId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a movie
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of reviews
 */
router.get("/:movieId", optionalProtect, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    let reviews, total;
    if (req.query.sort === "helpful") {
      // Aggregation with user lookup for author name
      const [result] = await Review.aggregate([
        { $match: { movieId: req.params.movieId } },
        { $addFields: { helpfulCount: { $size: { $ifNull: ["$helpful", []] } } } },
        { $sort: { helpfulCount: -1, createdAt: -1 } },
        { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "_userDoc" } },
        { $addFields: { user: { $arrayElemAt: ["$_userDoc", 0] } } },
        { $project: { _userDoc: 0 } },
        { $facet: {
            data:  [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: "total" }],
        }},
      ]);
      reviews = result.data;
      total   = result.count[0]?.total || 0;
    } else {
      [reviews, total] = await Promise.all([
        Review.find({ movieId: req.params.movieId })
          .populate("user", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments({ movieId: req.params.movieId }),
      ]);
    }

    // req.user is set by optionalProtect when a valid Bearer token is present
    const requestUserId = req.user?._id ?? null;

    res.json({
      reviews: reviews.map(r => serializeReview(r, requestUserId)),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
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
router.post("/", protect, validate(createReviewSchema), async (req, res) => {
  try {
    const movieId = sanitizeText(req.body.movieId, 40);
    const movieTitle = sanitizeText(req.body.movieTitle || "", 200);
    const content = sanitizeText(req.body.content, 1000);
    const rating = req.body.rating ? Number(req.body.rating) : null;

    if (!movieId || content.length < 2) {
      return res.status(400).json({ message: "Movie id and review text are required" });
    }

    if (rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // AI content moderation (only runs if GROQ_API_KEY is set)
    if (process.env.GROQ_API_KEY) {
      const moderation = await moderateReview(content);
      if (!moderation.safe) {
        return res.status(400).json({
          message: `Review flagged: ${moderation.reason}. Please revise your review.`,
        });
      }
    }

    const review = new Review({
      movieId,
      movieTitle,
      user: req.user._id,
      author: req.user.name,
      content,
      rating,
    });
    await review.save();
    res.status(201).json(serializeReview(review, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit review
router.put("/:reviewId", protect, validate(editReviewSchema), async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own review" });
    }
    const content = sanitizeText(req.body.content, 1000);
    const rating = req.body.rating !== undefined ? (req.body.rating ? Number(req.body.rating) : null) : review.rating;

    if (content.length < 2) return res.status(400).json({ message: "Review text too short" });
    if (rating !== null && (rating < 1 || rating > 5)) return res.status(400).json({ message: "Rating must be 1-5" });

    review.content = content;
    review.rating = rating;
    await review.save();
    res.json(serializeReview(review, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle helpful vote
router.post("/:reviewId/helpful", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const uid = req.user._id.toString();
    const idx = review.helpful.findIndex(id => id.toString() === uid);
    if (idx >= 0) {
      review.helpful.splice(idx, 1); // un-vote
    } else {
      review.helpful.push(req.user._id); // vote
    }
    await review.save();
    res.json({ helpfulCount: review.helpful.length, helpfulByMe: idx < 0 });
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