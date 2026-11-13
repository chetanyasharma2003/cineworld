import mongoose from "mongoose";

const activityFeedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["review", "watchlist", "follow", "recommendation"],
      required: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    movieId: Number,
    movieTitle: String,
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

activityFeedSchema.index({ userId: 1, createdAt: -1 });
activityFeedSchema.index({ userId: 1, read: 1 });

export default mongoose.model("ActivityFeed", activityFeedSchema);
