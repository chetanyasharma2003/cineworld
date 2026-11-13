import express from "express";
import {
  getDashboard,
  getAllUsers,
  banUser,
  unbanUser,
  deleteReview,
  getActivityLogs,
  getReports,
  featureMovie,
  updateUserRole,
  getAnalyticsDashboard,
  getDauMetrics,
  getMauMetrics,
  getFeatureUsageMetrics,
} from "../controllers/adminController.js";
import { protectAdmin, isAdmin, isModerator } from "../middleware/adminAuth.js";

const router = express.Router();

// All admin routes require authentication and admin/moderator role
router.use(protectAdmin);

// Dashboard & analytics
router.get("/dashboard", isAdmin, getDashboard);
router.get("/analytics", isAdmin, getAnalyticsDashboard);
router.get("/analytics/dau", isAdmin, getDauMetrics);
router.get("/analytics/mau", isAdmin, getMauMetrics);
router.get("/analytics/features", isAdmin, getFeatureUsageMetrics);

// User management
router.get("/users", isModerator, getAllUsers);
router.post("/users/:userId/ban", isAdmin, banUser);
router.post("/users/:userId/unban", isAdmin, unbanUser);
router.patch("/users/:userId/role", isAdmin, updateUserRole);

// Content moderation
router.delete("/reviews/:reviewId", isModerator, deleteReview);

// Activity & reports
router.get("/logs", isAdmin, getActivityLogs);
router.get("/reports", isModerator, getReports);

// Featured content
router.post("/featured-movies", isAdmin, featureMovie);

export default router;
