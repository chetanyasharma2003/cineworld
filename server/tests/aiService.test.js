import test from "node:test";
import assert from "node:assert/strict";
import { computeTasteVector } from "../services/aiService.js";

test("computeTasteVector returns empty object for empty watchlist", () => {
  assert.deepEqual(computeTasteVector([]), {});
});

test("computeTasteVector normalizes genre weights to 0-1", () => {
  const watchlist = [
    { genre_ids: [28, 12] },   // Action, Adventure
    { genre_ids: [28, 35] },   // Action, Comedy
    { genre_ids: [28] },       // Action
  ];
  const vector = computeTasteVector(watchlist);

  // Action (28) appears 3/5 times = 0.6
  assert.equal(vector[28], 0.6);
  // Adventure (12) and Comedy (35) each 1/5 = 0.2
  assert.equal(vector[12], 0.2);
  assert.equal(vector[35], 0.2);
});

test("computeTasteVector handles movies with no genre_ids", () => {
  const watchlist = [
    { title: "Movie A" },
    { genre_ids: [], title: "Movie B" },
    { genre_ids: [28], title: "Movie C" },
  ];
  const vector = computeTasteVector(watchlist);
  assert.equal(vector[28], 1.0);
});

test("computeTasteVector weights sum to 1.0", () => {
  const watchlist = [
    { genre_ids: [28, 12, 35] },
    { genre_ids: [18, 27] },
  ];
  const vector = computeTasteVector(watchlist);
  const total = Object.values(vector).reduce((a, b) => a + b, 0);
  // Allow small floating-point deviation
  assert.ok(Math.abs(total - 1.0) < 0.01, `Expected sum ~1, got ${total}`);
});
