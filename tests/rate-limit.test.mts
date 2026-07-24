/**
 * Unit tests for the contact/newsletter rate limiter — pure logic, no DB.
 * Run: `npm test`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { clientIp, createRateLimiter, hashIp, isRateLimited } from "../lib/contact/rateLimit.ts";

// ── clientIp: trusted-header extraction ──────────────────────────────────────
test("clientIp prefers x-real-ip over x-forwarded-for", () => {
  const h: Record<string, string> = { "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1, 2.2.2.2" };
  assert.equal(clientIp((n) => h[n]), "9.9.9.9");
});

test("clientIp falls back to the first x-forwarded-for hop", () => {
  const h: Record<string, string> = { "x-forwarded-for": "1.1.1.1, 2.2.2.2" };
  assert.equal(clientIp((n) => h[n]), "1.1.1.1");
});

test("clientIp returns 'unknown' when no IP header is present (missing/malformed)", () => {
  assert.equal(clientIp(() => null), "unknown");
  assert.equal(clientIp(() => ""), "unknown");
  assert.equal(clientIp(() => undefined), "unknown");
});

// ── hashIp: never stores a raw IP ────────────────────────────────────────────
test("hashIp is a deterministic sha256 hex and hides the raw IP", () => {
  const a = hashIp("203.0.113.7");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, hashIp("203.0.113.7")); // deterministic
  assert.notEqual(a, hashIp("203.0.113.8")); // distinct inputs → distinct keys
  assert.ok(!a.includes("203.0.113.7")); // raw IP not present
});

// ── isRateLimited: shared store + fail-safe fallback ─────────────────────────
const passFallback = createRateLimiter({ windowMs: 1000, max: 100 }); // never blocks in these tests

test("allowed submission: shared store under the limit → not limited", async () => {
  const limited = await isRateLimited({
    ipHash: "h",
    fallback: passFallback,
    sharedCheck: async () => false,
  });
  assert.equal(limited, false);
});

test("blocked submission: shared store over the limit → limited", async () => {
  const limited = await isRateLimited({
    ipHash: "h",
    fallback: passFallback,
    sharedCheck: async () => true,
  });
  assert.equal(limited, true);
});

test("store failure: shared store throws → fails safe to the in-memory fallback", async () => {
  // Fallback that WOULD block (max 0) proves the fallback path is actually used.
  const blockingFallback = createRateLimiter({ windowMs: 1000, max: 0 });
  let fellBack = false;
  const limited = await isRateLimited({
    ipHash: "h",
    fallback: blockingFallback,
    onFallback: () => {
      fellBack = true;
    },
    sharedCheck: async () => {
      throw new Error("store down");
    },
  });
  assert.equal(fellBack, true, "onFallback should fire when the store errors");
  assert.equal(limited, true, "fallback limiter (max 0) blocks the 1st hit");
});

test("no shared store configured → uses the in-memory fallback directly", async () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 2, now: () => 1000 });
  const call = () => isRateLimited({ ipHash: "same", fallback: limiter });
  assert.equal(await call(), false); // 1
  assert.equal(await call(), false); // 2
  assert.equal(await call(), true); // 3 → over max=2
});
