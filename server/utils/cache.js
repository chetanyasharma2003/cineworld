/**
 * Unified cache — uses Redis when REDIS_URL is set, falls back to in-memory LRU.
 * All callers use the same API: cacheGet / cacheSet / cacheDelete / withCache.
 */

// ── In-memory fallback ────────────────────────────────────────────────────────
const store = new Map();

function memGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return entry.value;
}

function memSet(key, value, ttlSeconds = 300) {
  if (store.size >= 2000) store.delete(store.keys().next().value);
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDelete(key) { store.delete(key); }

// ── Redis (optional) ──────────────────────────────────────────────────────────
let redis = null;

async function initRedis() {
  if (!process.env.REDIS_URL) return;
  try {
    const { default: Redis } = await import("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      connectTimeout: 3000,
    });
    await redis.connect();
    redis.on("error", () => { redis = null; }); // fall back silently on errors
    console.log("[cache] Redis connected at", process.env.REDIS_URL);
  } catch {
    redis = null;
    console.warn("[cache] Redis unavailable — using in-memory cache");
  }
}

// Fire and forget — redis will be null until connection resolves
initRedis();

// ── Public API ────────────────────────────────────────────────────────────────
export async function cacheGet(key) {
  if (redis) {
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch { /* fall through */ }
  }
  return memGet(key);
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch { /* fall through */ }
  }
  memSet(key, value, ttlSeconds);
}

export async function cacheDelete(key) {
  if (redis) {
    try { await redis.del(key); } catch { /* ignore */ }
  }
  memDelete(key);
}

// ── Express middleware factory ────────────────────────────────────────────────
export function withCache(ttlSeconds = 300) {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await cacheGet(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cacheSet(key, body, ttlSeconds).catch(() => {});
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };
    next();
  };
}
