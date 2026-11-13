import logger from "../utils/logger.js";

class RequestDeduplicator {
  constructor(ttl = 5000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  getKey(method, path, body) {
    const bodyStr = JSON.stringify(body || {});
    return `${method}:${path}:${bodyStr}`;
  }

  set(key, value) {
    const entry = {
      value,
      timestamp: Date.now(),
      timeout: setTimeout(() => {
        this.cache.delete(key);
      }, this.ttl),
    };
    this.cache.set(key, entry);
    return value;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttl) {
      clearTimeout(entry.timeout);
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  clear() {
    for (const entry of this.cache.values()) {
      clearTimeout(entry.timeout);
    }
    this.cache.clear();
  }
}

class QueryOptimizer {
  // Batch multiple MongoDB queries into a single aggregation pipeline
  static async batchQueries(queries, db) {
    try {
      const results = await Promise.all(queries);
      return results;
    } catch (err) {
      logger.error("Batch query failed", { error: err.message });
      throw err;
    }
  }

  // Index analysis: identify slow queries
  static async analyzeIndexes(collection) {
    try {
      const stats = await collection.collection.stats();
      const indexes = await collection.collection.getIndexes();

      return {
        documentCount: stats.count,
        totalSize: stats.size,
        avgDocSize: stats.avgObjSize,
        indexes: Object.keys(indexes),
      };
    } catch (err) {
      logger.error("Index analysis failed", { error: err.message });
      return null;
    }
  }

  // Projection optimization: only fetch needed fields
  static projectFields(model, fields) {
    return model.select(fields.join(" "));
  }

  // Pagination helper with skip/limit optimization
  static paginate(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }
}

class CacheOptimizer {
  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total).toFixed(2);
  }

  recordHit() {
    this.stats.hits++;
  }

  recordMiss() {
    this.stats.misses++;
  }

  recordEviction() {
    this.stats.evictions++;
  }

  getStats() {
    return {
      ...this.stats,
      hit_rate: this.getHitRate(),
    };
  }

  resetStats() {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
}

class ConnectionPool {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.waitingQueue = [];
  }

  async acquire() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release() {
    this.activeConnections--;
    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift();
      this.activeConnections++;
      resolve();
    }
  }

  getStats() {
    return {
      active: this.activeConnections,
      waiting: this.waitingQueue.length,
      total: this.maxConnections,
    };
  }
}

class RequestQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.process();
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
    };
  }
}

// Middleware for request deduplication
export const requestDeduplicator = new RequestDeduplicator(5000);

export const deduplicateRequests = (req, res, next) => {
  // Only deduplicate GET requests
  if (req.method !== "GET") {
    return next();
  }

  const key = requestDeduplicator.getKey(req.method, req.path, req.query);
  const cached = requestDeduplicator.get(key);

  if (cached) {
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    requestDeduplicator.set(key, data);
    return originalJson(data);
  };

  next();
};

export { RequestDeduplicator, QueryOptimizer, CacheOptimizer, ConnectionPool, RequestQueue };
