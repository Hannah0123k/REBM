/**
 * Unit tests for "You May Also Like" ranking (lib/blog/related) — pure, no DB.
 * Locks the spec's preference order: same post type → shared tags → recency,
 * plus the exact return count.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { isMarketWatchTags, rankRelated } from "../lib/blog/related.ts";

const tag = (slug: string) => ({ slug });
const post = (id: string, slugs: string[]) => ({ id, tags: slugs.map(tag) });

test("isMarketWatchTags detects market-watch / market-pulse tags", () => {
  assert.equal(isMarketWatchTags([tag("market-watch")]), true);
  assert.equal(isMarketWatchTags([tag("market-pulse")]), true);
  assert.equal(isMarketWatchTags([tag("office"), tag("leasing")]), false);
  assert.equal(isMarketWatchTags([]), false);
});

test("same post type outranks a different type even with more shared tags", () => {
  const current = post("cur", ["market-watch", "office"]);
  const sameTypeNoShared = post("a", ["market-watch"]); // same type, 0 shared non-type tags
  const diffTypeManyShared = post("b", ["office", "retail", "industrial"]); // article, shares "office"
  const ranked = rankRelated(current, [diffTypeManyShared, sameTypeNoShared], 2);
  assert.deepEqual(
    ranked.map((p) => p.id),
    ["a", "b"], // same-type wins the top slot regardless of input order
  );
});

test("within the same type, more shared tags rank higher", () => {
  const current = post("cur", ["office", "leasing", "cap-rates"]);
  const oneShared = post("a", ["office"]);
  const twoShared = post("b", ["office", "leasing"]);
  const ranked = rankRelated(current, [oneShared, twoShared], 2);
  assert.deepEqual(ranked.map((p) => p.id), ["b", "a"]);
});

test("equal scores fall back to incoming (recency) order via a stable sort", () => {
  const current = post("cur", ["office"]);
  // Both share exactly one tag and are the same (article) type → equal score.
  const newer = post("newer", ["office"]);
  const older = post("older", ["office"]);
  const ranked = rankRelated(current, [newer, older], 2); // newest-first order preserved
  assert.deepEqual(ranked.map((p) => p.id), ["newer", "older"]);
});

test("returns at most `limit` posts", () => {
  const current = post("cur", ["office"]);
  const pool = [post("a", ["office"]), post("b", ["office"]), post("c", ["office"])];
  assert.equal(rankRelated(current, pool, 2).length, 2);
  assert.equal(rankRelated(current, pool, 1).length, 1);
  assert.equal(rankRelated(current, [], 2).length, 0);
});
