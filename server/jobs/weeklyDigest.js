import cron from "node-cron";
import User from "../models/User.js";
import { generateWeeklyPicks } from "../services/aiService.js";
import { sendWeeklyDigestEmail } from "../utils/mailer.js";
import logger from "../utils/logger.js";

/**
 * Weekly digest job — runs every Monday at 09:00 server time.
 * For each user with ≥3 watchlist items, generates 5 AI picks and emails them.
 */
export function startWeeklyDigestJob() {
  // "0 9 * * 1" = 09:00 every Monday
  cron.schedule("0 9 * * 1", async () => {
    logger.info("[WeeklyDigest] Job started");

    if (!process.env.GROQ_API_KEY) {
      logger.warn("[WeeklyDigest] GROQ_API_KEY not set — skipping");
      return;
    }

    let sent = 0;
    let failed = 0;

    try {
      // Process in batches of 50 to avoid memory spike
      const cursor = User.find({
        emailVerified: true,
        digestOptOut: { $ne: true },
        "watchlist.2": { $exists: true }, // at least 3 items
      })
        .select("name email watchlist")
        .lean()
        .cursor();

      for await (const user of cursor) {
        try {
          const picks = await generateWeeklyPicks(user.name, user.watchlist);
          if (!picks.length) continue;
          await sendWeeklyDigestEmail(user.email, user.name, picks);
          sent++;
          // Small gap to avoid hammering the AI API
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          failed++;
          logger.error(`[WeeklyDigest] Failed for ${user.email}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`[WeeklyDigest] Fatal error: ${err.message}`);
    }

    logger.info(`[WeeklyDigest] Done — sent: ${sent}, failed: ${failed}`);
  });

  logger.info("[WeeklyDigest] Scheduled — runs every Monday at 09:00");
}
