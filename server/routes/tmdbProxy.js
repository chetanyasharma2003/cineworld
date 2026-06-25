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

// Generic proxy — forwards any GET path + query to TMDB
// e.g. GET /api/tmdb/search/movie?query=inception
router.get("/*path", (req, res, next) => withCache(ttlFor(req.path))(req, res, next), async (req, res) => {
  try {
    const { data } = await tmdb.get(req.path, { params: req.query });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data || "TMDB request failed" });
  }
});

export default router;
