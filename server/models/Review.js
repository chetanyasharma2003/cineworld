import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, index: true },
    movieTitle: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    author: { type: String, required: true },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, default: null }, // ✅ 1-5 stars
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// Compound index: fast lookup of a user's review for a specific movie
reviewSchema.index({ movieId: 1, user: 1 }, { unique: true });
// Sort reviews by date for a movie
reviewSchema.index({ movieId: 1, createdAt: -1 });
// Sort by rating for aggregation queries
reviewSchema.index({ movieId: 1, rating: -1 });

export default mongoose.model("Review", reviewSchema);