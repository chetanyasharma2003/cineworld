import express from "express";
import axios from "axios";
import https from "https";
import { env } from "../config/env.js";
import { withCache } from "../utils/cache.js";

const router = express.Router();

// Reuse TCP connections to TMDB — avoids TLS handshake on every request
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: { Authorization: `Bearer ${env.TMDB_TOKEN}` },
  timeout: 10_000,
  httpsAgent: keepAliveAgent,
});

// Cache TTL by endpoint type:
//   movie/tv detail pages — rarely change, cache 1 hour
//   search results        — cache 3 min (user-driven, fresh)
//   everything else       — cache 10 min
function ttlFor(path) {
  if (/^\/(movie|tv)\/\d+/.test(path)) return 60 * 60;   // 1 hour
  if (path.includes("/search/"))       return 3  * 60;   // 3 min
  return 10 * 60;                                         // 10 min
}

// Whitelist of allowed TMDB query parameters (prevent injection)
const ALLOWED_PARAMS = new Set([
  "query", "page", "include_adult", "language", "region", "year",
  "primary_release_year", "primary_release_date.gte", "primary_release_date.lte",
  "vote_count.gte", "vote_average.gte", "with_genres", "without_genres",
  "with_original_language", "sort_by", "timezone", "watch_region",
  "with_watch_providers", "watch_monetization_types",
]);

// Generic proxy — forwards GET path + whitelisted params to TMDB
// e.g. GET /api/tmdb/search/movie?query=inception
router.get("/*path", (req, res, next) => withCache(ttlFor(req.path))(req, res, next), async (req, res) => {
  try {
    // Filter params — only allow whitelisted ones
    const filteredParams = Object.entries(req.query)
      .filter(([key]) => ALLOWED_PARAMS.has(key))
      .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});

    const { data } = await tmdb.get(req.path, { params: filteredParams });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data || "TMDB request failed" });
  }
});

export default router;
