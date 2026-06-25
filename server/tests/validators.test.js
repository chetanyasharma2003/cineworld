import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  normalizeEmail,
  sanitizeMovieForList,
  sanitizeMovieForWatchlist,
  sanitizeText,
  validatePassword,
} from "../utils/validators.js";

test("normalizes and validates email addresses", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("validates password length", () => {
  assert.equal(validatePassword("1234567"), "Password must be at least 8 characters long");
  assert.equal(validatePassword("12345678"), null);
});

test("sanitizes text and saved movies", () => {
  assert.equal(sanitizeText("  hello world  ", 20), "hello world");
  assert.deepEqual(sanitizeMovieForList({ id: 123, title: "Movie", vote_average: 7.8 }), {
    id: 123,
    title: "Movie",
    poster_path: "",
    backdrop_path: "",
    release_date: "",
    vote_average: 7.8,
    genre_ids: [],
    overview: "",
    _mediaType: "movie",
  });
});

test("sanitizes watchlist movies with status", () => {
  assert.deepEqual(
    sanitizeMovieForWatchlist({ id: 42, title: "Inception" }, "watching"),
    { id: 42, title: "Inception", poster_path: "", backdrop_path: "", release_date: "", vote_average: 0, genre_ids: [], overview: "", status: "watching", _mediaType: "movie" },
  );

  const result = sanitizeMovieForWatchlist({ id: 1, title: "Test" });
  assert.equal(result.status, "want_to_watch");
  assert.equal(result._mediaType, "movie");

  assert.throws(
    () => sanitizeMovieForWatchlist({ id: 1, title: "Test" }, "completed"),
    /status must be one of/,
  );
});
