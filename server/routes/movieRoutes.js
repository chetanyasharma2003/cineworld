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

const router = express.Router();

router.get("/home", getHomeMovies);
router.get("/search", searchTmdbMovies);
router.get("/discover", discoverTmdbMovies); // ✅ NEW
router.get("/local", getMovies);
router.post("/local", protect, addMovie);
router.get("/:id", getMovieDetails);

export default router;