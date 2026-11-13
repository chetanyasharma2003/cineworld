import mongoose from "mongoose";
import crypto from "crypto";

const sharedListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movies: [
      {
        movieId: Number,
        title: String,
        posterPath: String,
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    isPublic: { type: Boolean, default: false },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    sharedWith: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: { type: String, enum: ["view", "edit"], default: "view" },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sharedListSchema.index({ owner: 1 });
sharedListSchema.index({ shareToken: 1 });
sharedListSchema.index({ isPublic: 1, createdAt: -1 });

export default mongoose.model("SharedList", sharedListSchema);
