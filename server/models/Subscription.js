import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    tier: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["active", "past_due", "canceled", "unpaid"],
      default: "active",
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    canceledAt: Date,
    autoRenew: { type: Boolean, default: true },
    paymentMethod: {
      brand: String,
      last4: String,
      expMonth: Number,
      expYear: Number,
    },
    features: {
      adFree: { type: Boolean, default: false },
      priorityAI: { type: Boolean, default: false },
      customLists: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
