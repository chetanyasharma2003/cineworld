export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sanitizeText = (value = "", maxLength = 1000) => {
  return String(value).trim().slice(0, maxLength);
};

export const validatePassword = (password = "") => {
  if (password.length < 8) return "Password must be at least 8 characters long";
  return null;
};

export const WATCHLIST_STATUSES = ["want_to_watch", "watching", "watched"];

export const sanitizeMovieForWatchlist = (movie = {}, status = "want_to_watch") => {
  const id = Number(movie.id || movie.tmdbId);
  const title = sanitizeText(movie.title || movie.name, 200);

  if (!Number.isFinite(id) || !title) {
    throw new Error("A valid movie id and title are required");
  }

  if (!WATCHLIST_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${WATCHLIST_STATUSES.join(", ")}`);
  }

  const genre_ids = Array.isArray(movie.genre_ids)
    ? movie.genre_ids.map(Number).filter(Boolean)
    : Array.isArray(movie.genres)
    ? movie.genres.map(g => Number(g.id)).filter(Boolean)
    : [];

  return {
    id,
    title,
    poster_path:   movie.poster_path  || "",
    backdrop_path: movie.backdrop_path || "",
    release_date:  movie.release_date  || "",
    vote_average:  Number(movie.vote_average) || 0,
    genre_ids,
    overview:      sanitizeText(movie.overview || "", 500),
    status,
    _mediaType:    movie._mediaType === "tv" ? "tv" : "movie",
  };
};

export const sanitizeMovieForList = (movie = {}) => {
  const id = Number(movie.id || movie.tmdbId);
  const title = sanitizeText(movie.title || movie.name, 200);

  if (!Number.isFinite(id) || !title) {
    throw new Error("A valid movie id and title are required");
  }

  // ✅ genre_ids aur genres dono save karo — AI recommendations ke liye
  const genre_ids = Array.isArray(movie.genre_ids)
    ? movie.genre_ids.map(Number).filter(Boolean)
    : Array.isArray(movie.genres)
    ? movie.genres.map(g => Number(g.id)).filter(Boolean)
    : [];

  return {
    id,
    title,
    poster_path:   movie.poster_path  || "",
    backdrop_path: movie.backdrop_path || "",
    release_date:  movie.release_date  || "",
    vote_average:  Number(movie.vote_average) || 0,
    genre_ids,
    overview:      sanitizeText(movie.overview || "", 500),
    _mediaType:    movie._mediaType === "tv" ? "tv" : "movie",
  };
};