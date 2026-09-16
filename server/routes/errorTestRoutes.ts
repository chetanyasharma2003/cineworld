/**
 * Error Testing Routes
 * These routes intentionally throw errors for testing error tracking
 * Only enabled in development mode
 */

import { Router, Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

const router = Router();

// Middleware to restrict to development only
router.use((_req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
});

/**
 * Simulate a validation error
 */
router.get("/test/validation-error", (): void => {
  throw new (class ValidationError extends Error {
    status = 400;
  })("Invalid email format");
});

/**
 * Simulate a database error
 */
router.get("/test/db-error", (): void => {
  throw new (class DatabaseError extends Error {
    name = "MongooseError";
    status = 500;
  })("Connection to MongoDB failed");
});

/**
 * Simulate an external API error (rate limit)
 */
router.get("/test/api-rate-limit", (): void => {
  throw new (class RateLimitError extends Error {
    status = 429;
  })("Too many requests to TMDB API");
});

/**
 * Simulate an authentication error
 */
router.get("/test/auth-error", (): void => {
  throw new (class AuthError extends Error {
    status = 401;
  })("Invalid or expired token");
});

/**
 * Simulate an unhandled promise rejection
 */
router.get("/test/promise-rejection", (_req: Request, res: Response): void => {
  Promise.reject(new Error("Unhandled promise rejection"));
  res.json({ message: "Error will be logged asynchronously" });
});

/**
 * Simulate an uncaught exception
 */
router.get("/test/uncaught-exception", (): void => {
  // Simulate async error not caught
  setImmediate((): void => {
    throw new Error("Uncaught exception in async context");
  });
});

/**
 * Simulate a fatal error (500)
 */
router.get("/test/fatal-error", (): void => {
  throw new Error("Critical system failure");
});

/**
 * Simulate an error with additional context
 */
router.get("/test/error-with-context", (): void => {
  Sentry.withScope((scope): void => {
    scope.setContext("userAction", {
      action: "test-error-generation",
      movieId: "12345",
      timestamp: new Date().toISOString(),
    });
    scope.addBreadcrumb({
      message: "User attempted to perform complex action",
      category: "user-action",
      level: "info",
    });

    throw new Error("Error with rich context for debugging");
  });
});

/**
 * Test Sentry directly
 */
router.post("/test/sentry-capture", (req: Request, res: Response): void => {
  const body = req.body as { message?: string; level?: string };
  const { message, level = "error" } = body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const validLevels: Sentry.SeverityLevel[] = ["fatal", "error", "warning", "info", "debug"];
  const sentryLevel = (validLevels.includes(level as Sentry.SeverityLevel)
    ? level
    : "error") as Sentry.SeverityLevel;

  Sentry.captureMessage(message, sentryLevel);
  res.json({
    message: "Message captured by Sentry",
    payload: { message, level: sentryLevel },
  });
});

/**
 * Get error monitoring stats
 */
router.get("/test/stats", (_req: Request, res: Response): void => {
  // Import here to avoid circular dependency
  import("../services/errorMonitoring.js").then(({ errorStats }) => {
    res.json({
      summary: errorStats.getSummary(),
      recentErrors: errorStats.getRecent(5),
    });
  });
});

export default router;
