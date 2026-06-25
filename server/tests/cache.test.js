import test from "node:test";
import assert from "node:assert/strict";

// Test in-memory path only (no Redis in CI)
delete process.env.REDIS_URL;

const { cacheGet, cacheSet, cacheDelete } = await import("../utils/cache.js");

test("cacheSet and cacheGet round-trip", async () => {
  await cacheSet("test:key", { foo: "bar" }, 10);
  const val = await cacheGet("test:key");
  assert.deepEqual(val, { foo: "bar" });
});

test("cacheGet returns null for missing key", async () => {
  const val = await cacheGet("test:missing-" + Date.now());
  assert.equal(val, null);
});

test("cacheGet returns null after TTL expiry", async () => {
  // Set with 0 TTL — should expire immediately
  await cacheSet("test:expire", "should-expire", 0);
  // Wait a tick so the TTL check fires
  await new Promise(r => setTimeout(r, 10));
  const val = await cacheGet("test:expire");
  assert.equal(val, null);
});

test("cacheDelete removes a key", async () => {
  await cacheSet("test:delete", 42, 60);
  await cacheDelete("test:delete");
  const val = await cacheGet("test:delete");
  assert.equal(val, null);
});
