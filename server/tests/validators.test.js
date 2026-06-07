import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  normalizeEmail,
  sanitizeMovieForList,
  sanitizeText,
  validatePassword,
} from "../utils/validators.js";

test("normalizes and validates email addresses", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("validates password length", () => {
  assert.equal(validatePassword("12345"), "Password must be at least 6 characters long");
  assert.equal(validatePassword("123456"), null);
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
  });
});
