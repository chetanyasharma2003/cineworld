import "dotenv/config";
import { validateEnv } from "./config/env.js";
validateEnv();
import * as Sentry from "@sentry/node";
import http from "http";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/db.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tmdbProxy from "./routes/tmdbProxy.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import logger from "./utils/logger.js";
import { startWeeklyDigestJob } from "./jobs/weeklyDigest.js";

// ── Sentry (error monitoring) ─────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CineWorld API",
      version: "1.0.0",
      description: "Full-stack movie discovery platform API",
    },
    servers: [{ url: "/api", description: "API base" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth",          description: "Authentication & token management" },
      { name: "Movies",        description: "TMDB movie data" },
      { name: "Reviews",       description: "User reviews & ratings" },
      { name: "Users",         description: "Watchlist & profile" },
      { name: "AI",            description: "AI-powered features (Groq)" },
      { name: "Notifications", description: "Real-time SSE notifications" },
    ],
  },
  apis: ["./routes/*.js"],
});

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

// ── In-process metrics collector ──────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  byRoute: {},
  responseTimes: [],
  startTime: Date.now(),
};

function recordMetric(route, statusCode, durationMs) {
  metrics.requests++;
  if (statusCode >= 500) metrics.errors++;
  metrics.byRoute[route] = (metrics.byRoute[route] || 0) + 1;
  metrics.responseTimes.push(durationMs);
  // Keep last 1000 samples
  if (metrics.responseTimes.length > 1000) metrics.responseTimes.shift();
}

// ── Rate limiters ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,                  // was 200 — a single page load triggers 10+ API calls
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts, please try again later." },
});

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:3000",
    ].filter(Boolean);
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    if (!IS_PROD && origin.startsWith("http://localhost:")) return callback(null, true);
    // Allow all Vercel preview deployments for this project
    if (origin.match(/^https:\/\/cineworld(-[a-z0-9]+)*-chetanya-s-projects\.vercel\.app$/)) return callback(null, true);
    return IS_PROD
      ? callback(new Error(`CORS: origin ${origin} not allowed`))
      : callback(null, true);
  },
  credentials: true,
}));

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://ui-avatars.com"],
      connectSrc: ["'self'", "https://api.themoviedb.org"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// ── Compression (gzip) — skip SSE connections ─────────────────────────────────
app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept === "text/event-stream") return false;
    return compression.filter(req, res);
  },
}));

// ── Request ID + metrics timing ───────────────────────────────────────────────
app.use((req, res, next) => {
  const id = Math.random().toString(36).slice(2, 10);
  req.requestId = id;
  req._startTime = Date.now();
  res.setHeader("x-request-id", id);

  res.on("finish", () => {
    const route = req.route?.path
      ? `${req.method} ${req.baseUrl || ""}${req.route.path}`
      : `${req.method} ${req.path}`;
    recordMetric(route, res.statusCode, Date.now() - req._startTime);
  });

  next();
});

// ── Request logging ────────────────────────────────────────────────────────────
app.use(morgan(IS_PROD ? "combined" : "dev", {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Body parsing & sanitization ───────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
// express-mongo-sanitize is incompatible with Express 5 (req.query is a read-only getter)
// Manually sanitize only body and params to prevent NoSQL injection ($gt, $where etc.)
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// ── Static uploads ────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", (req, res, next) => {
  // Override Helmet's same-origin CORP so the client (different port) can load avatars
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads"), {
  maxAge: IS_PROD ? "30d" : 0,
}));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api", limiter);
app.use("/api/auth", authLimiter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tmdb", tmdbProxy);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// ── Health check ───────────────────────────────────────────────────────────────
const startTime = Date.now();
app.get("/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000) + "s",
    db: dbState[mongoose.connection.readyState] || "unknown",
    env: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => res.json({ message: "CineWorld API running ✅" }));

// ── Metrics endpoint ──────────────────────────────────────────────────────────
app.get("/metrics", (req, res) => {
  const times = metrics.responseTimes;
  const sorted = [...times].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  res.json({
    uptime_seconds: Math.floor((Date.now() - metrics.startTime) / 1000),
    total_requests: metrics.requests,
    total_errors: metrics.errors,
    error_rate: metrics.requests ? (metrics.errors / metrics.requests).toFixed(4) : "0",
    response_time_ms: { avg, p50, p95, p99 },
    top_routes: Object.entries(metrics.byRoute)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
    db_state: ["disconnected","connected","connecting","disconnecting"][mongoose.connection.readyState] || "unknown",
  });
});

// Trust proxy so rate-limiter uses real client IP (not reverse-proxy IP)
app.set("trust proxy", 1);

// ── Global error handler ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(err.status || 500).json({ message: IS_PROD ? "Internal server error" : err.message });
});

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
let server;

connectDB().then(() => {
  server = http.createServer(app);
  startWeeklyDigestJob();

  // Keep connections alive between requests instead of re-handshaking each time.
  // keepAliveTimeout must be > any upstream load-balancer idle timeout (usually 60s).
  server.keepAliveTimeout = 65_000;
  server.headersTimeout   = 66_000; // must be > keepAliveTimeout

  // Allow many concurrent connections per process
  server.maxConnections = 1000;

  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server?.close(async () => {
    logger.info("HTTP server closed");
    await mongoose.connection.close();
    logger.info("MongoDB disconnected");
    process.exit(0);
  });
  // Force-kill after 10s if connections don't drain
  setTimeout(() => { logger.error("Forced exit"); process.exit(1); }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err.message, stack: err.stack });
  process.exit(1);
});
