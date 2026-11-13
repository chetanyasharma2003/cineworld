import axios from "axios";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const TMDB = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: env.TMDB_TOKEN },
});

// Advanced search with filters (genre, year, rating, sort)
export const advancedSearch = async (req, res) => {
  try {
    const {
      q, // search query
      genres, // comma-separated genre IDs: "28,18"
      year_gte, // year >=
      year_lte, // year <=
      rating_gte, // rating >=
      rating_lte, // rating <=
      sort_by = "popularity.desc", // popularity.desc, rating.desc, year.desc, etc
      page = 1,
      limit = 20,
    } = req.query;

    // Build TMDB params
    const params = {
      page: parseInt(page) || 1,
      region: "US",
      vote_count_gte: 100, // Minimum votes for quality
    };

    // Add genres if provided
    if (genres) {
      params.with_genres = genres;
    }

    // Add year range
    if (year_gte) {
      params.primary_release_year = {
        gte: parseInt(year_gte),
      };
    }
    if (year_lte) {
      if (!params.primary_release_year) params.primary_release_year = {};
      params.primary_release_year.lte = parseInt(year_lte);
    }

    // Add rating range
    if (rating_gte) {
      params.vote_average_gte = parseFloat(rating_gte);
    }
    if (rating_lte) {
      params.vote_average_lte = parseFloat(rating_lte);
    }

    // Add sort
    if (sort_by) {
      params.sort_by = sort_by;
    }

    // Search query
    let response;
    if (q) {
      // If search query provided, use search endpoint
      response = await TMDB.get("/search/movie", {
        params: { query: q, page: params.page },
      });
    } else {
      // Otherwise use discover endpoint with filters
      response = await TMDB.get("/discover/movie", { params });
    }

    const results = response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      genre_ids: movie.genre_ids,
      popularity: movie.popularity,
    }));

    logger.info("Advanced search completed", {
      query: q,
      genres,
      year_range: `${year_gte}-${year_lte}`,
      rating_range: `${rating_gte}-${rating_lte}`,
      results: results.length,
    });

    res.json({
      success: true,
      query: { q, genres, year_gte, year_lte, rating_gte, rating_lte, sort_by },
      results,
      total: response.data.total_results,
      pages: response.data.total_pages,
      current_page: parseInt(page),
    });
  } catch (err) {
    logger.error("Advanced search failed", {
      error: err.message,
      query: req.query,
    });
    res.status(500).json({ message: "Search failed" });
  }
};

// Get available genres
export const getGenres = async (req, res) => {
  try {
    const response = await TMDB.get("/genre/movie/list");
    const genres = response.data.genres.map((g) => ({
      id: g.id,
      name: g.name,
    }));

    res.json({ success: true, genres });
  } catch (err) {
    logger.error("Failed to fetch genres", { error: err.message });
    res.status(500).json({ message: "Failed to fetch genres" });
  }
};

// Get movies by specific genre
export const getByGenre = async (req, res) => {
  try {
    const { genreId, page = 1, sort_by = "popularity.desc" } = req.query;

    if (!genreId) {
      return res.status(400).json({ message: "Genre ID required" });
    }

    const response = await TMDB.get("/discover/movie", {
      params: {
        with_genres: genreId,
        sort_by,
        page: parseInt(page),
        vote_count_gte: 100,
      },
    });

    const results = response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genre_ids: movie.genre_ids,
    }));

    res.json({
      success: true,
      genre_id: genreId,
      results,
      total: response.data.total_results,
      current_page: parseInt(page),
    });
  } catch (err) {
    logger.error("Get by genre failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch movies" });
  }
};

// Get movies by year range
export const getByYear = async (req, res) => {
  try {
    const { year_gte, year_lte, page = 1, sort_by = "popularity.desc" } = req.query;

    const params = { sort_by, page: parseInt(page), vote_count_gte: 100 };

    if (year_gte) params.primary_release_year = { gte: parseInt(year_gte) };
    if (year_lte) {
      if (!params.primary_release_year) params.primary_release_year = {};
      params.primary_release_year.lte = parseInt(year_lte);
    }

    const response = await TMDB.get("/discover/movie", { params });

    const results = response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    }));

    res.json({
      success: true,
      year_range: { gte: year_gte, lte: year_lte },
      results,
      total: response.data.total_results,
      current_page: parseInt(page),
    });
  } catch (err) {
    logger.error("Get by year failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch movies" });
  }
};

// Top rated movies with customizable filters
export const getTopRated = async (req, res) => {
  try {
    const { rating_gte = 7, page = 1, genres } = req.query;

    const params = {
      sort_by: "vote_average.desc",
      page: parseInt(page),
      vote_average_gte: parseFloat(rating_gte),
      vote_count_gte: 100,
    };

    if (genres) params.with_genres = genres;

    const response = await TMDB.get("/discover/movie", { params });

    const results = response.data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genre_ids: movie.genre_ids,
    }));

    res.json({
      success: true,
      min_rating: rating_gte,
      results,
      total: response.data.total_results,
      current_page: parseInt(page),
    });
  } catch (err) {
    logger.error("Get top rated failed", { error: err.message });
    res.status(500).json({ message: "Failed to fetch top-rated movies" });
  }
};
