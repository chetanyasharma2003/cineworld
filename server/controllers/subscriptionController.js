import StripeService from "../services/stripeService.js";
import Subscription from "../models/Subscription.js";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

export const getSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      subscription = new Subscription({
        userId: req.user._id,
        tier: "free",
        status: "active",
      });
      await subscription.save();
    }

    res.json({ success: true, subscription });
  } catch (err) {
    logger.error("Get subscription failed", { error: err.message });
    res.status(500).json({ message: "Failed to get subscription" });
  }
};

export const upgradeTier = async (req, res) => {
  try {
    const { tier } = req.body;

    if (!["free", "pro", "premium"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier" });
    }

    if (tier === "free") {
      await StripeService.cancelSubscription(req.user._id);
    } else {
      await StripeService.createSubscription(req.user._id, tier);
    }

    const subscription = await Subscription.findOne({ userId: req.user._id });
    res.json({ success: true, subscription });
  } catch (err) {
    logger.error("Upgrade tier failed", { error: err.message });
    res.status(500).json({ message: "Failed to upgrade subscription" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await StripeService.cancelSubscription(req.user._id);
    res.json({ success: true, subscription });
  } catch (err) {
    logger.error("Cancel subscription failed", { error: err.message });
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await StripeService.getPaymentMethods(req.user._id);
    res.json({ success: true, methods });
  } catch (err) {
    logger.error("Get payment methods failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const rawBody = req.rawBody || req.body;

    if (!env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Webhook secret not configured" });
    }

    // In production, verify signature with Stripe
    // const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    const event = JSON.parse(rawBody);

    await StripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook handling failed", { error: err.message });
    res.status(400).json({ message: "Webhook error" });
  }
};

export const getPricingTiers = async (req, res) => {
  res.json({
    success: true,
    tiers: [
      {
        name: "Free",
        tier: "free",
        price: 0,
        features: {
          movies: "Unlimited",
          reviews: "Unlimited",
          watchlist: "Unlimited",
          aiFeatures: "Basic",
          adFree: false,
        },
      },
      {
        name: "Pro",
        tier: "pro",
        price: 4.99,
        period: "month",
        features: {
          movies: "Unlimited",
          reviews: "Unlimited",
          watchlist: "Unlimited",
          aiFeatures: "Priority",
          adFree: true,
          customLists: true,
        },
      },
      {
        name: "Premium",
        tier: "premium",
        price: 9.99,
        period: "month",
        features: {
          movies: "Unlimited",
          reviews: "Unlimited",
          watchlist: "Unlimited",
          aiFeatures: "Priority",
          adFree: true,
          customLists: true,
          advancedAnalytics: true,
          prioritySupport: true,
        },
      },
    ],
  });
};
