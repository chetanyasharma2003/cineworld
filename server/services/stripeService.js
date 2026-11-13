import Stripe from "stripe";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "");

const PRICING = {
  free: { monthly: 0, features: {} },
  pro: {
    monthly: 499, // $4.99
    stripePriceId: "price_1ABC123XYZ_pro",
    features: { adFree: true, priorityAI: true, customLists: true },
  },
  premium: {
    monthly: 999, // $9.99
    stripePriceId: "price_1ABC123XYZ_premium",
    features: { adFree: true, priorityAI: true, customLists: true, advancedAnalytics: true, prioritySupport: true },
  },
};

export class StripeService {
  static async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });

      const subscription = await Subscription.findOneAndUpdate(
        { userId: user._id },
        { stripeCustomerId: customer.id },
        { upsert: true, new: true }
      );

      logger.info("Stripe customer created", { userId: user._id, customerId: customer.id });
      return subscription;
    } catch (err) {
      logger.error("Failed to create Stripe customer", { error: err.message });
      throw err;
    }
  }

  static async createSubscription(userId, tier) {
    try {
      const user = await User.findById(userId);
      let subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        subscription = await this.createCustomer(user);
      }

      if (!subscription.stripeCustomerId) {
        throw new Error("No Stripe customer ID");
      }

      if (tier === "free") {
        subscription.tier = "free";
        subscription.status = "active";
        subscription.features = PRICING.free.features || {};
        await subscription.save();
        return subscription;
      }

      const pricingTier = PRICING[tier];
      if (!pricingTier || !pricingTier.stripePriceId) {
        throw new Error("Invalid tier");
      }

      const stripeSubscription = await stripe.subscriptions.create({
        customer: subscription.stripeCustomerId,
        items: [{ price: pricingTier.stripePriceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      subscription.tier = tier;
      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.status = stripeSubscription.status;
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.features = pricingTier.features;
      await subscription.save();

      logger.info("Subscription created", { userId, tier, stripeSubscriptionId: stripeSubscription.id });
      return subscription;
    } catch (err) {
      logger.error("Failed to create subscription", { error: err.message });
      throw err;
    }
  }

  static async cancelSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error("No active subscription");
      }

      await stripe.subscriptions.del(subscription.stripeSubscriptionId);

      subscription.tier = "free";
      subscription.status = "canceled";
      subscription.canceledAt = new Date();
      subscription.features = {};
      await subscription.save();

      logger.info("Subscription canceled", { userId });
      return subscription;
    } catch (err) {
      logger.error("Failed to cancel subscription", { error: err.message });
      throw err;
    }
  }

  static async updatePaymentMethod(userId, paymentMethodId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) throw new Error("No subscription");

      await stripe.customers.update(subscription.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      logger.info("Payment method updated", { userId });
      return true;
    } catch (err) {
      logger.error("Failed to update payment method", { error: err.message });
      throw err;
    }
  }

  static async getPaymentMethods(userId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) return [];

      const methods = await stripe.customers.listPaymentMethods(subscription.stripeCustomerId);
      return methods.data;
    } catch (err) {
      logger.error("Failed to get payment methods", { error: err.message });
      return [];
    }
  }

  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;
      }
    } catch (err) {
      logger.error("Webhook processing failed", { error: err.message });
    }
  }

  static async handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (!subscription) return;

    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    await subscription.save();

    logger.info("Subscription updated via webhook", { subscriptionId: stripeSubscription.id });
  }

  static async handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (!subscription) return;

    subscription.tier = "free";
    subscription.status = "canceled";
    subscription.canceledAt = new Date();
    subscription.features = {};
    await subscription.save();

    logger.info("Subscription canceled via webhook", { subscriptionId: stripeSubscription.id });
  }

  static async handlePaymentSucceeded(invoice) {
    logger.info("Payment succeeded", { invoiceId: invoice.id });
  }

  static async handlePaymentFailed(invoice) {
    logger.warn("Payment failed", { invoiceId: invoice.id });
  }
}

export default StripeService;
