import rateLimit from "express-rate-limit";
import crypto from "crypto";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

// Per-user rate limiting (stricter than global)
export const perUserLimiter = rateLimit({
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || req.ip;
  },
  windowMs: 15 * 60 * 1000,
  max: (req, res) => {
    // Stricter limits for sensitive endpoints
    if (req.path.includes("/password") || req.path.includes("/email")) {
      return 3; // 3 requests per 15 min
    }
    if (req.path.includes("/ai")) {
      return 30; // 30 AI requests per 15 min
    }
    return 100; // 100 general requests per 15 min
  },
  skip: (req, res) => {
    // Skip admin users
    return req.user?.role === "admin";
  },
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF token generation and validation
const csrfTokens = new Map();

export const generateCSRFToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString("hex");
  const userId = req.user?._id?.toString() || req.ip;
  csrfTokens.set(userId, {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  res.setHeader("X-CSRF-Token", token);
  res.locals.csrfToken = token;
  next();
};

export const validateCSRFToken = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const userId = req.user?._id?.toString() || req.ip;
  const storedToken = csrfTokens.get(userId);

  if (!storedToken || !token || storedToken.token !== token) {
    logger.warn("CSRF token validation failed", { userId, path: req.path });
    return res.status(403).json({ error: "CSRF token invalid or expired" });
  }

  if (storedToken.expiresAt < Date.now()) {
    csrfTokens.delete(userId);
    logger.warn("CSRF token expired", { userId });
    return res.status(403).json({ error: "CSRF token expired" });
  }

  // Token is valid — rotate it
  csrfTokens.delete(userId);
  next();
};

// API Key authentication
const validApiKeys = new Set(
  (process.env.API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.api_key;

  if (!apiKey || !validApiKeys.has(apiKey)) {
    logger.warn("Invalid API key", { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  req.apiKeyValid = true;
  next();
};

// Secrets rotation helper (for API keys, tokens)
export class SecretsManager {
  constructor(encryptionKey) {
    this.encryptionKey = encryptionKey;
    this.secrets = new Map();
  }

  generateSecret(type = "token") {
    const secret = crypto.randomBytes(32).toString("hex");
    const encrypted = this.encrypt(secret);
    this.secrets.set(encrypted, {
      type,
      createdAt: Date.now(),
      rotatedAt: Date.now(),
    });
    return secret;
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(this.encryptionKey, "hex"),
      iv
    );
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  decrypt(encryptedData) {
    const [iv, authTag, encrypted] = encryptedData.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(this.encryptionKey, "hex"),
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  rotateSecret(oldSecret, type = "token") {
    // Retire old secret
    for (const [key, value] of this.secrets.entries()) {
      if (value.type === type) {
        this.secrets.delete(key);
      }
    }
    // Generate new secret
    return this.generateSecret(type);
  }

  isSecretValid(secret, maxAge = 24 * 60 * 60 * 1000) {
    for (const [key, value] of this.secrets.entries()) {
      try {
        const decrypted = this.decrypt(key);
        if (decrypted === secret) {
          const age = Date.now() - value.createdAt;
          return age < maxAge;
        }
      } catch (err) {
        // Decryption failed, skip
      }
    }
    return false;
  }
}

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};

// Input validation middleware
export const validateInputLength = (maxBodySize = 1024 * 100) => {
  return (req, res, next) => {
    const size = JSON.stringify(req.body || {}).length;
    if (size > maxBodySize) {
      logger.warn("Request body too large", { size, max: maxBodySize, path: req.path });
      return res.status(413).json({ error: "Request entity too large" });
    }
    next();
  };
};

// Audit logging for sensitive operations
export const auditLog = (operation) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode < 400) {
        logger.info(`[AUDIT] ${operation}`, {
          userId: req.user?._id,
          ip: req.ip,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        });
      }
      return originalJson(data);
    };

    next();
  };
};

// Detect suspicious patterns (brute force, enumeration, etc.)
export const anomalyDetection = (req, res, next) => {
  const ip = req.ip;
  const key = `anomaly:${ip}`;

  // In production, store in Redis for distributed anomaly detection
  // For now, using in-memory Map (ephemeral)
  if (!global.anomalyStore) {
    global.anomalyStore = new Map();
  }

  const record = global.anomalyStore.get(key) || { attempts: 0, lastAttempt: Date.now() };

  // Reset counter if > 1 hour
  if (Date.now() - record.lastAttempt > 60 * 60 * 1000) {
    record.attempts = 0;
  }

  // Flag 404s, 401s, injection attempts
  if (res.statusCode === 404 || res.statusCode === 401) {
    record.attempts++;
    record.lastAttempt = Date.now();

    if (record.attempts > 20) {
      logger.warn("Anomaly detected", { ip, attempts: record.attempts, type: "repeated_errors" });
    }
  }

  global.anomalyStore.set(key, record);
  next();
};
