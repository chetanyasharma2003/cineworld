import winston, { Logger } from "winston";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import { Request, NextFunction } from "express";

// Ensure logs directory exists
const logsDir = "logs";
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch {
  // Directory might already exist
}

const { combine, timestamp, colorize, printf, json, errors, metadata } = winston.format;

interface LogMeta {
  [key: string]: unknown;
  requestId?: string;
  userId?: string;
  duration?: number;
}

// ── Development format: colorized, human-readable ─────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss.SSS" }),
  errors({ stack: true }),
  printf((info: winston.Logform.TransformableInfo): string => {
    const { level, message, timestamp, requestId, userId, duration, ...meta } = info as Record<string, unknown> & LogMeta;
    const badges: string[] = [];
    if (requestId) badges.push(`req:${requestId}`);
    if (userId) badges.push(`user:${userId}`);
    if (duration !== undefined) badges.push(`${duration}ms`);

    const badgeStr = badges.length ? ` [${badges.join(" ")}]` : "";
    const metaStr = Object.keys(meta).length ? "\n  " + JSON.stringify(meta, null, 2) : "";

    return `${timestamp} [${level}]${badgeStr} ${message}${metaStr}`;
  })
);

// ── Production format: JSON with all context ──────────────────────────────────
const prodFormat = combine(
  timestamp({ format: "2024-01-01T00:00:00.000Z" }),
  errors({ stack: true }),
  metadata(),
  json()
);

// ── Winston logger instance ───────────────────────────────────────────────────
const logger: Logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: { service: "cineworld-api" },
  transports: [
    // Always log to console
    new winston.transports.Console(),

    // Production only: file logging
    ...(env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, "errors.log"),
            level: "error",
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, "exceptions.log") }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, "rejections.log") }),
  ],
});

// ── Add request context middleware helper ─────────────────────────────────────
export function withRequestContext(
  req: Request & { logger?: Record<string, (msg: string, meta?: LogMeta) => void> },
  _res: unknown,
  next: NextFunction
): void {
  const originalLog = logger.log.bind(logger);

  // Inject request ID and user info into all log calls
  const logWithContext = (level: string, message: string, meta: LogMeta = {}): void => {
    const context: Record<string, unknown> = {
      ...meta,
      requestId: (req as Request & { requestId?: string }).requestId,
      userId: (req as Request & { user?: { _id: { toString(): string } } }).user?._id?.toString(),
      method: req.method,
      path: req.path,
    };

    // Remove undefined values
    Object.keys(context).forEach((k: string): void => {
      if (context[k] === undefined) delete context[k];
    });

    originalLog(level, message, context);
  };

  req.logger = {
    debug: (msg: string, meta?: LogMeta): void => logWithContext("debug", msg, meta),
    info: (msg: string, meta?: LogMeta): void => logWithContext("info", msg, meta),
    warn: (msg: string, meta?: LogMeta): void => logWithContext("warn", msg, meta),
    error: (msg: string, meta?: LogMeta): void => logWithContext("error", msg, meta),
  };

  next();
}

export default logger;
