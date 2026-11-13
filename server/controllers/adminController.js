import User from "../models/User.js";
import Review from "../models/Review.js";
import logger from "../utils/logger.js";
import { AnalyticsService } from "../services/analyticsService.js";

// Get admin dashboard metrics
export const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ emailVerified: true });
    const totalReviews = await Review.countDocuments();
    const bannedUsers = await User.countDocuments({ role: "banned" });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email createdAt");

    const topReviewers = await Review.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      metrics: {
        total_users: totalUsers,
        active_users: activeUsers,
        banned_users: bannedUsers,
        total_reviews: totalReviews,
        activation_rate: ((activeUsers / totalUsers) * 100).toFixed(2) + "%",
      },
      recent_users: recentUsers,
      top_reviewers: topReviewers,
    });
  } catch (err) {
    logger.error("Dashboard fetch failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

// Get all users (with pagination)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, banned } = req.query;

    const query = {};
    if (role) query.role = role;
    if (banned === "true") query.bannedUntil = { $gt: new Date() };

    const users = await User.find(query)
      .select("-password -refreshToken")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("Get users failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration = 7 } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "banned";
    user.bannedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    user.banReason = reason || "Violation of community guidelines";
    await user.save();

    logger.warn("User banned", {
      admin: req.user._id,
      user: userId,
      reason,
      duration,
    });

    res.json({ success: true, message: `User banned for ${duration} days` });
  } catch (err) {
    logger.error("Ban user failed", { error: err.message });
    res.status(500).json({ message: "Failed to ban user" });
  }
};

// Unban user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "user";
    user.bannedUntil = null;
    user.banReason = null;
    await user.save();

    logger.info("User unbanned", { admin: req.user._id, user: userId });

    res.json({ success: true, message: "User unbanned" });
  } catch (err) {
    logger.error("Unban user failed", { error: err.message });
    res.status(500).json({ message: "Failed to unban user" });
  }
};

// Delete inappropriate review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    logger.warn("Review deleted by admin", {
      admin: req.user._id,
      review: reviewId,
      reason,
    });

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    logger.error("Delete review failed", { error: err.message });
    res.status(500).json({ message: "Failed to delete review" });
  }
};

// Get activity logs
export const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;

    const query = {};
    if (action) query.action = action;
    if (userId) query.targetId = userId;

    // In real implementation, create AdminAction collection
    // For now, return placeholder
    res.json({
      success: true,
      logs: [],
      message: "Activity logs not yet implemented",
    });
  } catch (err) {
    logger.error("Get activity logs failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

// Get reported content
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "open" } = req.query;

    // Placeholder for future report system
    res.json({
      success: true,
      reports: [],
      message: "Report system not yet implemented",
    });
  } catch (err) {
    logger.error("Get reports failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// Feature movie (add to homepage featured section)
export const featureMovie = async (req, res) => {
  try {
    const { movieId, duration = 7 } = req.body;

    // Placeholder for featured movies system
    res.json({
      success: true,
      message: `Movie ${movieId} featured for ${duration} days`,
    });
  } catch (err) {
    logger.error("Feature movie failed", { error: err.message });
    res.status(500).json({ message: "Failed to feature movie" });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "moderator", "admin", "banned"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    logger.info("User role updated", {
      admin: req.user._id,
      user: userId,
      newRole: role,
    });

    res.json({ success: true, user });
  } catch (err) {
    logger.error("Update user role failed", { error: err.message });
    res.status(500).json({ message: "Failed to update role" });
  }
};

// Get analytics dashboard
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7");

    const [dau, mau, topMovies, featureUsage, signupTrend] = await Promise.all([
      AnalyticsService.getDailyActiveUsers(days),
      AnalyticsService.getMonthlyActiveUsers(),
      AnalyticsService.getMostViewedMovies(10),
      AnalyticsService.getFeatureUsage(),
      AnalyticsService.getSignupTrend(days),
    ]);

    res.json({
      success: true,
      period_days: days,
      dau,
      mau,
      top_movies: topMovies,
      feature_usage: featureUsage,
      signup_trend: signupTrend,
    });
  } catch (err) {
    logger.error("Analytics dashboard failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// Get DAU metrics
export const getDauMetrics = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "30");
    const dau = await AnalyticsService.getDailyActiveUsers(days);

    res.json({
      success: true,
      days,
      data: dau,
      avg_dau: dau.length ? Math.round(dau.reduce((sum, d) => sum + d.count, 0) / dau.length) : 0,
    });
  } catch (err) {
    logger.error("DAU metrics failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch DAU metrics" });
  }
};

// Get MAU metrics
export const getMauMetrics = async (req, res) => {
  try {
    const mau = await AnalyticsService.getMonthlyActiveUsers();

    res.json({
      success: true,
      mau,
    });
  } catch (err) {
    logger.error("MAU metrics failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch MAU metrics" });
  }
};

// Get feature usage
export const getFeatureUsageMetrics = async (req, res) => {
  try {
    const usage = await AnalyticsService.getFeatureUsage();

    res.json({
      success: true,
      features: usage,
      total_usage: usage.reduce((sum, f) => sum + f.usage_count, 0),
    });
  } catch (err) {
    logger.error("Feature usage failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch feature usage" });
  }
};
