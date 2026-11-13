import express from "express";
import {
  advancedSearch,
  getGenres,
  getByGenre,
  getByYear,
  getTopRated,
} from "../controllers/advancedSearchController.js";
import { withCache } from "../utils/cache.js";

const router = express.Router();

// Advanced search with multiple filters
// GET /api/search/advanced?q=action&genres=28,18&year_gte=2020&rating_gte=7&sort_by=popularity.desc
router.get("/advanced", withCache(3 * 60), advancedSearch);

// Get all available genres
// GET /api/search/genres
router.get("/genres", withCache(24 * 60 * 60), getGenres);

// Get movies by genre
// GET /api/search/by-genre?genreId=28&page=1&sort_by=popularity.desc
router.get("/by-genre", withCache(5 * 60), getByGenre);

// Get movies by year range
// GET /api/search/by-year?year_gte=2020&year_lte=2024&page=1
router.get("/by-year", withCache(5 * 60), getByYear);

// Get top-rated movies
// GET /api/search/top-rated?rating_gte=8&genres=28&page=1
router.get("/top-rated", withCache(10 * 60), getTopRated);

export default router;
