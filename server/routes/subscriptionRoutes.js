import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSubscription,
  upgradeTier,
  cancelSubscription,
  getPaymentMethods,
  handleWebhook,
  getPricingTiers,
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Public pricing endpoint
router.get("/pricing", getPricingTiers);

// Webhook (no auth required)
router.post("/webhook", handleWebhook);

// Protected subscription endpoints
router.get("/", protect, getSubscription);
router.post("/upgrade", protect, upgradeTier);
router.post("/cancel", protect, cancelSubscription);
router.get("/payment-methods", protect, getPaymentMethods);

export default router;
