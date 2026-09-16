/// <reference path="../modules.d.ts" />
import cron from "node-cron";
import User from "../models/User.js";
import { generateWeeklyPicks } from "../services/aiService.js";
import { sendWeeklyDigestEmail } from "../utils/mailer.js";
import logger from "../utils/logger.js";

interface UserWithWatchlist {
  name: string;
  email: string;
  watchlist: unknown[];
}

/**
 * Weekly digest job — runs every Monday at 09:00 server time.
 * For each user with ≥3 watchlist items, generates 5 AI picks and emails them.
 */
export function startWeeklyDigestJob(): void {
  // "0 9 * * 1" = 09:00 every Monday
  cron.schedule("0 9 * * 1", async (): Promise<void> => {
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
          const typedUser = user as UserWithWatchlist;
          const picks = await generateWeeklyPicks(typedUser.name, typedUser.watchlist);
          if (!picks.length) continue;
          await sendWeeklyDigestEmail(typedUser.email, typedUser.name, picks);
          sent++;
          // Small gap to avoid hammering the AI API
          await new Promise((r: (value: void) => void): ReturnType<typeof setTimeout> =>
            setTimeout(r, 500)
          );
        } catch (err: unknown) {
          failed++;
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error(`[WeeklyDigest] Failed for ${(user as UserWithWatchlist).email}: ${errorMessage}`);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[WeeklyDigest] Fatal error: ${errorMessage}`);
    }

    logger.info(`[WeeklyDigest] Done — sent: ${sent}, failed: ${failed}`);
  });

  logger.info("[WeeklyDigest] Scheduled — runs every Monday at 09:00");
}
