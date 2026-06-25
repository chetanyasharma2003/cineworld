import express from "express";
import {
  addMovie,
  getHomeMovies,
  getMovieDetails,
  getMovies,
  searchTmdbMovies,
  discoverTmdbMovies,
} from "../controllers/movieController.js";
import { protect } from "../middleware/authMiddleware.js";
import { withCache } from "../utils/cache.js";

const router = express.Router();

router.get("/home",     withCache(10 * 60), getHomeMovies);   // 10 min cache
router.get("/search",   searchTmdbMovies);
router.get("/discover", withCache(5 * 60),  discoverTmdbMovies); // 5 min cache
router.get("/local",    getMovies);
router.post("/local",   protect, addMovie);
router.get("/:id",      withCache(60 * 60), getMovieDetails); // 1 hour cache

export default router;