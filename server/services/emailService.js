import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import { AnalyticsService } from "./analyticsService.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export class EmailService {
  static async sendWeeklyDigest(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || user.digestOptOut) return;

      const [topReviews, recommendations, friendActivity] = await Promise.all([
        Review.find({ movieId: { $in: user.watchlist.map((m) => m.id) } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        this.getPersonalizedRecommendations(user),
        this.getFriendActivity(user),
      ]);

      const html = `
        <h2>Your Weekly CineWorld Digest</h2>
        <h3>Top Reviews This Week</h3>
        <ul>
          ${topReviews.map((r) => `<li>${r.content} (${r.rating}/10)</li>`).join("")}
        </ul>
        <h3>Recommended For You</h3>
        <ul>
          ${recommendations.map((m) => `<li>${m.title}</li>`).join("")}
        </ul>
        <h3>Friends Activity</h3>
        <ul>
          ${friendActivity.map((a) => `<li>${a.message}</li>`).join("")}
        </ul>
      `;

      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: user.email,
        subject: "Your Weekly CineWorld Digest",
        html,
      });

      logger.info("Weekly digest sent", { userId });
    } catch (err) {
      logger.error("Failed to send weekly digest", { error: err.message });
    }
  }

  static async sendFriendNotification(userId, friendName, action) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const subject = `${friendName} ${action} on CineWorld`;
      const html = `
        <p>Hi ${user.name},</p>
        <p>${friendName} just ${action} on CineWorld!</p>
        <p><a href="https://cineworld.vercel.app">Check it out</a></p>
      `;

      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: user.email,
        subject,
        html,
      });

      logger.info("Friend notification sent", { userId, friendName });
    } catch (err) {
      logger.error("Failed to send friend notification", { error: err.message });
    }
  }

  static async sendAccountAlert(userId, alertType, details) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const alerts = {
        new_device: "A new device logged into your account",
        password_changed: "Your password was changed",
        email_changed: "Your email address was changed",
        suspicious_activity: "Suspicious activity detected on your account",
      };

      const html = `
        <p>Hi ${user.name},</p>
        <p>${alerts[alertType] || "Your account activity"}</p>
        <p>Details: ${JSON.stringify(details)}</p>
        <p>If this wasn't you, please <a href="https://cineworld.vercel.app/security">review your security settings</a></p>
      `;

      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: user.email,
        subject: `CineWorld Account Alert: ${alertType}`,
        html,
      });

      logger.info("Account alert sent", { userId, alertType });
    } catch (err) {
      logger.error("Failed to send account alert", { error: err.message });
    }
  }

  static async sendWatchlistExpiryReminder(userId, movieTitle, daysSinceAdded) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const html = `
        <p>Hi ${user.name},</p>
        <p>You added "${movieTitle}" to your watchlist ${daysSinceAdded} days ago.</p>
        <p>Don't forget to watch it before it leaves streaming!</p>
        <p><a href="https://cineworld.vercel.app/watchlist">View your watchlist</a></p>
      `;

      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: user.email,
        subject: `Don't Miss: ${movieTitle}`,
        html,
      });

      logger.info("Watchlist reminder sent", { userId, movieTitle });
    } catch (err) {
      logger.error("Failed to send watchlist reminder", { error: err.message });
    }
  }

  static async getPersonalizedRecommendations(user) {
    // Placeholder — would call AI service in production
    return [];
  }

  static async getFriendActivity(user) {
    // Placeholder — would fetch from activity feed
    return [];
  }
}

export default EmailService;
