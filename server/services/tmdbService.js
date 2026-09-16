import axios from "axios";
import { env } from "../config/env.js";

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  timeout: 12000,
});

tmdb.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${env.TMDB_TOKEN}`;
  config.headers.accept = "application/json";
  return config;
});

const get = async (url, params = {}) => {
  const response = await tmdb.get(url, { params });
  return response.data;
};

export const fetchHomeSections = async () => {
  const [
    popular, upcoming, topRated, nowPlaying,
    action, comedy, horror, scifi,
    animation, thriller, romance, bollywood,
  ] = await Promise.all([
    get("/movie/popular"),
    get("/movie/upcoming"),
    get("/movie/top_rated"),
    get("/movie/now_playing"),
    get("/discover/movie", { with_genres: 28, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 35, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 27, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 878, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 16, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 53, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_genres: 10749, sort_by: "popularity.desc" }),
    get("/discover/movie", { with_original_language: "hi", sort_by: "popularity.desc" }),
  ]);

  return {
    popular: popular.results || [],
    upcoming: upcoming.results || [],
    topRated: topRated.results || [],
    nowPlaying: nowPlaying.results || [],
    action: action.results || [],
    comedy: comedy.results || [],
    horror: horror.results || [],
    scifi: scifi.results || [],
    animation: animation.results || [],
    thriller: thriller.results || [],
    romance: romance.results || [],
    bollywood: bollywood.results || [],
  };
};

export const searchMovies = async (query) => {
  if (!query?.trim()) return [];
  const data = await get("/search/movie", { query: query.trim(), include_adult: false });
  return (data.results || []).filter((movie) => movie.poster_path).slice(0, 10);
};

export const discoverMovies = async ({ query, genre, year, year_gte, year_lte, language, sort, rating, page = 1 }) => {
  let results, totalPages, totalResults;

  if (query?.trim()) {
    // Text search: query BOTH movies and TV shows in parallel, then merge.
    const [movieData, tvData] = await Promise.all([
      get("/search/movie", {
        query: query.trim(),
        include_adult: false,
        page,
        ...(year && { year }),
        ...(language && { language }),
      }),
      get("/search/tv", {
        query: query.trim(),
        include_adult: false,
        page,
        ...(language && { language }),
      }),
    ]);

    // Normalize into one common shape so the client can render both the same way.
    // Movies use `title`/`release_date`; TV shows use `name`/`first_air_date`.
    const movies = (movieData.results || []).map(m => ({ ...m, media_type: "movie" }));
    const tvShows = (tvData.results || []).map(t => ({
      ...t,
      media_type: "tv",
      title: t.name,
      release_date: t.first_air_date,
    }));

    let merged = [...movies, ...tvShows];
    if (genre)    merged = merged.filter(x => x.genre_ids?.includes(Number(genre)));
    if (rating)   merged = merged.filter(x => x.vote_average >= Number(rating));
    if (language) merged = merged.filter(x => x.original_language === language);
    merged = merged.filter(x => x.poster_path);
    merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    results      = merged;
    totalPages   = Math.max(movieData.total_pages || 1, tvData.total_pages || 1);
    totalResults = (movieData.total_results || 0) + (tvData.total_results || 0);
  } else {
    const params = {
      sort_by: sort || "popularity.desc",
      page,
      include_adult: false,
      "vote_count.gte": 50,
    };
    if (genre)     params.with_genres            = genre;
    if (year)      params.primary_release_year   = year;
    if (year_gte)  params["primary_release_date.gte"] = `${year_gte}-01-01`;
    if (year_lte)  params["primary_release_date.lte"] = `${year_lte}-12-31`;
    if (language)  params.with_original_language = language;
    if (rating)    params["vote_average.gte"]    = rating;

    const data   = await get("/discover/movie", params);
    results      = (data.results || []).filter(m => m.poster_path).map(m => ({ ...m, media_type: "movie" }));
    totalPages   = data.total_pages || 1;
    totalResults = data.total_results || results.length;
  }

  return { results, totalPages, totalResults };
};

export const fetchMovieBundle = async (movieId) => {
  const [movie, similar, credits, videos, providers] = await Promise.all([
    get(`/movie/${movieId}`),
    get(`/movie/${movieId}/similar`),
    get(`/movie/${movieId}/credits`),
    get(`/movie/${movieId}/videos`),
    get(`/movie/${movieId}/watch/providers`),
  ]);

  const trailer = (videos.results || []).find(
    (video) => video.type === "Trailer" && video.site === "YouTube",
  );

  return {
    movie,
    similar: (similar.results || []).slice(0, 12),
    cast: (credits.cast || []).slice(0, 8),
    providers: providers.results || {},
    trailerKey: trailer?.key || null,
  };
};