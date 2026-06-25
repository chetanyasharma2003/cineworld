import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    icon:    { type: String, default: "🔔" },
    text:    { type: String, required: true, trim: true },
    link:    { type: String, default: null },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast unread lookup per user
notificationSchema.index({ user: 1, read: 1 });
// Pagination by date
notificationSchema.index({ user: 1, createdAt: -1 });
// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model("Notification", notificationSchema);
