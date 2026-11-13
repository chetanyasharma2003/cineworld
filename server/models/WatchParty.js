import mongoose from "mongoose";

const watchPartySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    movieId: { type: Number, required: true },
    movieTitle: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["invited", "joined", "watched"], default: "invited" },
      },
    ],
    scheduledFor: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "active", "completed", "cancelled"], default: "scheduled" },
    description: { type: String, default: "" },
    maxMembers: { type: Number, default: 10 },
    platform: { type: String, enum: ["discord", "zoom", "twitch", "custom"], default: "custom" },
    meetingUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

watchPartySchema.index({ organizer: 1, scheduledFor: 1 });
watchPartySchema.index({ status: 1 });
watchPartySchema.index({ "members.userId": 1 });

export default mongoose.model("WatchParty", watchPartySchema);
