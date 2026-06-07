import Movie from "../models/movieModel.js";
import Review from "../models/Review.js";
import { fetchHomeSections, fetchMovieBundle, searchMovies, discoverMovies } from "../services/tmdbService.js";

export const getHomeMovies = async (req, res) => {
  try {
    const sections = await fetchHomeSections();
    res.json({ success: true, sections });
  } catch (error) {
    res.status(502).json({ success: false, message: "Failed to load movie data" });
  }
};

export const searchTmdbMovies = async (req, res) => {
  try {
    const results = await searchMovies(req.query.query || "");
    res.json({ success: true, results });
  } catch (error) {
    res.status(502).json({ success: false, message: "Failed to search movies" });
  }
};

// ✅ NEW — Discover with filters
export const discoverTmdbMovies = async (req, res) => {
  try {
    const { query, genre, year, sort, rating, page } = req.query;
    const data = await discoverMovies({ query, genre, year, sort, rating, page: Number(page) || 1 });
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(502).json({ success: false, message: "Failed to discover movies" });
  }
};

export const getMovieDetails = async (req, res) => {
  try {
    const bundle = await fetchMovieBundle(req.params.id);
    const reviews = await Review.find({ movieId: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, ...bundle, reviews });
  } catch (error) {
    res.status(502).json({ success: false, message: "Failed to load movie details" });
  }
};

export const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addMovie = async (req, res) => {
  try {
    const movie = new Movie({ ...req.body, title: String(req.body.title || "").trim() });
    if (!movie.title) return res.status(400).json({ success: false, message: "Movie title is required" });
    await movie.save();
    res.status(201).json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};