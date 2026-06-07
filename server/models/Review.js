import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, required: true },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, default: null }, // ✅ 1-5 stars
  },
  { timestamps: true },
);

export default mongoose.model("Review", reviewSchema);