export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sanitizeText = (value = "", maxLength = 1000) => {
  return String(value).trim().slice(0, maxLength);
};

export const validatePassword = (password = "") => {
  if (password.length < 6) return "Password must be at least 6 characters long";
  return null;
};

export const sanitizeMovieForList = (movie = {}) => {
  const id = Number(movie.id || movie.tmdbId);
  const title = sanitizeText(movie.title || movie.name, 200);

  if (!Number.isFinite(id) || !title) {
    throw new Error("A valid movie id and title are required");
  }

  return {
    id,
    title,
    poster_path: movie.poster_path || "",
    backdrop_path: movie.backdrop_path || "",
    release_date: movie.release_date || "",
    vote_average: Number(movie.vote_average) || 0,
  };
};
