import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  date: Date,
  event: String, // 'signup', 'login', 'movie_view', 'review_create', 'ai_used', 'follow'
  userId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

const Analytics = mongoose.model("Analytics", analyticsSchema);

export class AnalyticsService {
  // Track user signup
  static async trackSignup(userId, method = "email") {
    try {
      await Analytics.create({
        date: new Date(),
        event: "signup",
        userId,
        metadata: { method },
      });
    } catch (err) {
      console.error("Failed to track signup:", err.message);
    }
  }

  // Track user login
  static async trackLogin(userId) {
    try {
      await Analytics.create({
        date: new Date(),
        event: "login",
        userId,
      });
    } catch (err) {
      console.error("Failed to track login:", err.message);
    }
  }

  // Track movie view
  static async trackMovieView(userId, movieId, movieTitle) {
    try {
      await Analytics.create({
        date: new Date(),
        event: "movie_view",
        userId,
        metadata: { movieId, movieTitle },
      });
    } catch (err) {
      console.error("Failed to track movie view:", err.message);
    }
  }

  // Track review creation
  static async trackReviewCreate(userId, movieId, rating) {
    try {
      await Analytics.create({
        date: new Date(),
        event: "review_create",
        userId,
        metadata: { movieId, rating },
      });
    } catch (err) {
      console.error("Failed to track review:", err.message);
    }
  }

  // Track AI feature usage
  static async trackAIUsage(userId, feature, params = {}) {
    try {
      await Analytics.create({
        date: new Date(),
        event: "ai_used",
        userId,
        metadata: { feature, ...params },
      });
    } catch (err) {
      console.error("Failed to track AI usage:", err.message);
    }
  }

  // Track follow action
  static async trackFollow(userId, targetUserId) {
    try {
      await Analytics.create({
        date: new Date(),
        event: "follow",
        userId,
        metadata: { targetUserId },
      });
    } catch (err) {
      console.error("Failed to track follow:", err.message);
    }
  }

  // Get daily active users
  static async getDailyActiveUsers(days = 7) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await Analytics.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffDate },
            event: "login",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
              },
            },
            count: { $addToSet: "$userId" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            date: "$_id",
            count: { $size: "$count" },
          },
        },
      ]);

      return result;
    } catch (err) {
      console.error("Failed to get DAU:", err.message);
      return [];
    }
  }

  // Get monthly active users
  static async getMonthlyActiveUsers() {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await Analytics.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffDate },
            event: "login",
          },
        },
        {
          $group: {
            _id: null,
            count: { $addToSet: "$userId" },
          },
        },
        {
          $project: {
            mau: { $size: "$count" },
          },
        },
      ]);

      return result[0]?.mau || 0;
    } catch (err) {
      console.error("Failed to get MAU:", err.message);
      return 0;
    }
  }

  // Get most viewed movies
  static async getMostViewedMovies(limit = 10) {
    try {
      const result = await Analytics.aggregate([
        { $match: { event: "movie_view" } },
        {
          $group: {
            _id: "$metadata.movieId",
            title: { $first: "$metadata.movieTitle" },
            views: { $sum: 1 },
          },
        },
        { $sort: { views: -1 } },
        { $limit: limit },
      ]);

      return result;
    } catch (err) {
      console.error("Failed to get most viewed movies:", err.message);
      return [];
    }
  }

  // Get feature usage stats
  static async getFeatureUsage() {
    try {
      const result = await Analytics.aggregate([
        { $match: { event: "ai_used" } },
        {
          $group: {
            _id: "$metadata.feature",
            count: { $sum: 1 },
            users: { $addToSet: "$userId" },
          },
        },
        {
          $project: {
            feature: "$_id",
            usage_count: "$count",
            unique_users: { $size: "$users" },
          },
        },
        { $sort: { usage_count: -1 } },
      ]);

      return result;
    } catch (err) {
      console.error("Failed to get feature usage:", err.message);
      return [];
    }
  }

  // Get signup trend
  static async getSignupTrend(days = 7) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await Analytics.aggregate([
        {
          $match: {
            timestamp: { $gte: cutoffDate },
            event: "signup",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return result;
    } catch (err) {
      console.error("Failed to get signup trend:", err.message);
      return [];
    }
  }
}

export default Analytics;
