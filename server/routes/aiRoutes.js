import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import * as ai from "../services/aiService.js";

const router = express.Router();

// AI endpoints are expensive — tighter rate limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,                   // 60 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please wait a moment." },
});
router.use(aiLimiter);

// Guard: fail fast if no API key configured
router.use((req, res, next) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI features are not configured on this server." });
  }
  next();
});

/**
 * POST /api/ai/search
 * Parse natural language → TMDB discover params
 * Body: { query: string }
 */
router.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "query is required" });

  try {
    const params = await ai.parseSearchQuery(query.trim().slice(0, 300));
    res.json({ params });
  } catch {
    res.status(500).json({ error: "AI search failed" });
  }
});

/**
 * POST /api/ai/mood
 * Get 6 mood-based movie recommendations
 * Body: { mood: string, watchedTitles?: string[] }
 */
router.post("/mood", async (req, res) => {
  const { mood, watchedTitles } = req.body;
  if (!mood?.trim()) return res.status(400).json({ error: "mood is required" });

  try {
    const recommendations = await ai.getMoodRecommendations(
      mood.trim().slice(0, 200),
      Array.isArray(watchedTitles) ? watchedTitles : []
    );
    res.json({ recommendations });
  } catch {
    res.status(500).json({ error: "AI mood recommendations failed" });
  }
});

/**
 * POST /api/ai/compare
 * AI verdict for two movies
 * Body: { movieA: object, movieB: object }
 */
router.post("/compare", async (req, res) => {
  const { movieA, movieB } = req.body;
  if (!movieA?.title || !movieB?.title) {
    return res.status(400).json({ error: "movieA and movieB with titles are required" });
  }

  try {
    const verdict = await ai.getCompareVerdict(movieA, movieB);
    res.json({ verdict });
  } catch {
    res.status(500).json({ error: "AI compare failed" });
  }
});

/**
 * GET /api/ai/insights
 * Watchlist taste analysis (protected)
 */
router.get("/insights", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("watchlist");
    if (!user?.watchlist?.length || user.watchlist.length < 3) {
      return res.json({ insights: null, reason: "Add at least 3 movies to your watchlist for insights." });
    }

    const insights = await ai.getTasteInsights(user.watchlist);
    res.json({ insights });
  } catch {
    res.status(500).json({ error: "AI insights failed" });
  }
});

/**
 * POST /api/ai/chat
 * Streaming movie chat with conversational memory (SSE)
 * Body: { movieContext: object, message: string, history?: [{user, assistant}] }
 */
router.post("/chat", async (req, res) => {
  const { movieContext, message, history } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "message is required" });
  if (!movieContext?.title) return res.status(400).json({ error: "movieContext with title is required" });

  // Validate history shape — accept only well-formed turns
  const safeHistory = Array.isArray(history)
    ? history
        .filter(t => typeof t?.user === "string" && typeof t?.assistant === "string")
        .slice(-6)
    : [];

  // RAG: fetch real community reviews for this movie from our DB
  let ragReviews = [];
  if (movieContext.movieId) {
    try {
      ragReviews = await Review.find({ movieId: String(movieContext.movieId) })
        .select("content rating")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    } catch { /* non-fatal — chat still works without reviews */ }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await ai.streamMovieChat(
      movieContext,
      message.trim().slice(0, 500),
      (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      safeHistory,
      ragReviews
    );
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Chat failed", done: true })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/ai/for-you
 * Personalised recommendations from watchlist (protected)
 */
router.post("/for-you", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("watchlist");
    if (!user?.watchlist?.length || user.watchlist.length < 3) {
      return res.json({ recommendations: [], reason: "Add at least 3 movies to your watchlist." });
    }
    const recommendations = await ai.getForYouRecommendations(user.watchlist);
    res.json({ recommendations });
  } catch {
    res.status(500).json({ error: "AI For You failed" });
  }
});

/**
 * POST /api/ai/review-summary
 * Summarise and sentiment-analyse reviews
 * Body: { reviews: [{ content, rating }] }
 */
router.post("/review-summary", async (req, res) => {
  const { reviews } = req.body;
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ error: "reviews array is required" });
  }
  try {
    const summary = await ai.summarizeReviews(reviews);
    res.json({ summary });
  } catch {
    res.status(500).json({ error: "Review summarization failed" });
  }
});

/**
 * POST /api/ai/similar
 * AI "similar but different" movie picks
 * Body: { movie: object }
 */
router.post("/similar", async (req, res) => {
  const { movie } = req.body;
  if (!movie?.title) return res.status(400).json({ error: "movie with title is required" });
  try {
    const recommendations = await ai.getSimilarButDifferent(movie);
    res.json({ recommendations });
  } catch {
    res.status(500).json({ error: "Similar movies failed" });
  }
});

/**
 * POST /api/ai/watchlist-group
 * Smart mood-based watchlist grouping (protected)
 */
router.post("/watchlist-group", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("watchlist");
    if (!user?.watchlist?.length || user.watchlist.length < 4) {
      return res.json({ groups: null, reason: "Add at least 4 movies to your watchlist." });
    }
    const result = await ai.groupWatchlist(user.watchlist);
    res.json(result || { groups: null });
  } catch {
    res.status(500).json({ error: "Watchlist grouping failed" });
  }
});

/**
 * POST /api/ai/watchlist-chat
 * Streaming natural language watchlist chat (protected, SSE)
 * Body: { message: string }
 */
router.post("/watchlist-chat", protect, async (req, res) => {
  const { message, history } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "message is required" });

  const safeHistory = Array.isArray(history)
    ? history.filter(t => typeof t?.user === "string" && typeof t?.assistant === "string").slice(-6)
    : [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const user = await User.findById(req.user._id).select("watchlist");
    const watchlist = user?.watchlist || [];
    await ai.streamWatchlistChat(
      watchlist,
      message.trim().slice(0, 500),
      (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); },
      safeHistory
    );
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Chat failed", done: true })}\n\n`);
    res.end();
  }
});

/**
 * @openapi
 * /ai/feedback:
 *   post:
 *     tags: [AI]
 *     summary: Submit thumbs up/down on an AI movie recommendation
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:    { type: number }
 *               movieTitle: { type: string }
 *               liked:      { type: boolean }
 *     responses:
 *       200:
 *         description: Feedback saved
 */
/**
 * POST /api/ai/feedback
 * Store thumbs up/down on an AI-recommended movie (protected)
 * Body: { movieId: number, movieTitle: string, liked: boolean }
 */
router.post("/feedback", protect, async (req, res) => {
  const { movieId, movieTitle, liked } = req.body;
  if (!movieId || typeof liked !== "boolean") {
    return res.status(400).json({ error: "movieId and liked (boolean) are required" });
  }

  try {
    const user = await User.findById(req.user._id).select("aiFeedback");

    // Replace existing feedback for same movie, or push new
    const existing = user.aiFeedback.findIndex(f => f.movieId === Number(movieId));
    if (existing >= 0) {
      user.aiFeedback[existing].liked = liked;
      user.aiFeedback[existing].createdAt = new Date();
    } else {
      user.aiFeedback.push({ movieId: Number(movieId), movieTitle: movieTitle || "", liked });
    }

    // Keep last 100 feedback entries
    if (user.aiFeedback.length > 100) user.aiFeedback = user.aiFeedback.slice(-100);

    await user.save();
    res.json({ ok: true, liked });
  } catch {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

/**
 * POST /api/ai/smart-for-you
 * Personalised recommendations using watchlist + feedback loop (protected)
 */
router.post("/smart-for-you", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("watchlist aiFeedback");

    if (!user?.watchlist?.length || user.watchlist.length < 3) {
      return res.json({ recommendations: [], reason: "Add at least 3 movies to your watchlist." });
    }

    const likedTitles = (user.aiFeedback || [])
      .filter(f => f.liked).map(f => f.movieTitle).filter(Boolean);
    const dislikedTitles = (user.aiFeedback || [])
      .filter(f => !f.liked).map(f => f.movieTitle).filter(Boolean);

    const recommendations = await ai.getSmartRecommendations(
      user.watchlist, likedTitles, dislikedTitles
    );
    res.json({ recommendations });
  } catch (err) {
    console.error("[smart-for-you]", err?.message || err);
    res.status(500).json({ error: "Smart recommendations failed", detail: process.env.NODE_ENV !== "production" ? err?.message : undefined });
  }
});

/**
 * POST /api/ai/poster-mood
 * Multi-modal: analyse movie poster image → mood + aesthetic tags
 * Body: { posterUrl: string, movieTitle: string }
 */
router.post("/poster-mood", async (req, res) => {
  const { posterUrl, movieTitle } = req.body;
  if (!posterUrl || !movieTitle) {
    return res.status(400).json({ error: "posterUrl and movieTitle are required" });
  }

  // Only allow TMDB image URLs for security
  if (!posterUrl.startsWith("https://image.tmdb.org/")) {
    return res.status(400).json({ error: "Only TMDB image URLs are allowed" });
  }

  try {
    const result = await ai.analyzeMoviePoster(posterUrl, movieTitle);
    if (!result) return res.status(503).json({ error: "Poster analysis unavailable" });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Poster mood analysis failed" });
  }
});

/**
 * POST /api/ai/vector-similar
 * @openapi
 * /ai/vector-similar:
 *   post:
 *     tags: [AI]
 *     summary: Find movies similar to a target using cosine similarity on feature vectors
 *     description: |
 *       Ranks a list of candidate movies by cosine similarity to the target movie.
 *       Feature vector = [genre_presence x20, year_normalized, rating_normalized].
 *       No external service needed — pure math.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target:     { type: object, description: "Movie to find similar to" }
 *               candidates: { type: array,  description: "Movies to rank" }
 *     responses:
 *       200:
 *         description: Candidates ranked by similarity score
 */
router.post("/vector-similar", async (req, res) => {
  const { target, candidates } = req.body;
  if (!target || !Array.isArray(candidates) || !candidates.length) {
    return res.status(400).json({ error: "target and candidates[] are required" });
  }
  try {
    const ranked = ai.rankBySimilarity(target, candidates.slice(0, 100));
    res.json({ ranked });
  } catch {
    res.status(500).json({ error: "Vector similarity failed" });
  }
});

/**
 * POST /api/ai/taste-similar
 * Find candidates most similar to user's watchlist taste centroid (protected)
 * Body: { candidates: Movie[] }
 */
router.post("/taste-similar", protect, async (req, res) => {
  const { candidates } = req.body;
  if (!Array.isArray(candidates) || !candidates.length) {
    return res.status(400).json({ error: "candidates[] is required" });
  }
  try {
    const user = await User.findById(req.user._id).select("watchlist");
    if (!user?.watchlist?.length) {
      return res.json({ ranked: candidates });
    }
    const centroid = ai.computeCentroid(user.watchlist);
    const ranked   = ai.rankBySimilarity(centroid, candidates.slice(0, 100));
    res.json({ ranked });
  } catch {
    res.status(500).json({ error: "Taste similarity failed" });
  }
});

/**
 * GET /api/ai/taste-vector
 * Compute and store genre taste vector from watchlist (protected)
 */
router.get("/taste-vector", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("watchlist tasteVector");
    if (!user?.watchlist?.length) {
      return res.json({ tasteVector: {}, reason: "No watchlist items yet." });
    }

    const vector = ai.computeTasteVector(user.watchlist);
    // Persist updated vector
    await User.findByIdAndUpdate(req.user._id, { tasteVector: vector });

    res.json({ tasteVector: vector });
  } catch {
    res.status(500).json({ error: "Taste vector computation failed" });
  }
});

/**
 * POST /api/ai/person-chat
 * Streaming chat about a director or actor (SSE)
 * Body: { personContext: { name, knownFor, biography?, birthday?, placeOfBirth?, knownDepartment? }, message: string, history?: [{user, assistant}] }
 */
router.post("/person-chat", async (req, res) => {
  const { personContext, message, history } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "message is required" });
  if (!personContext?.name) return res.status(400).json({ error: "personContext with name is required" });

  const safeHistory = Array.isArray(history)
    ? history.filter(t => typeof t?.user === "string" && typeof t?.assistant === "string").slice(-6)
    : [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await ai.streamPersonChat(
      personContext,
      message.trim().slice(0, 500),
      (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
      () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); },
      safeHistory
    );
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Chat failed", done: true })}\n\n`);
    res.end();
  }
});

export default router;
