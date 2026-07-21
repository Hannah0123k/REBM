/**
 * "You May Also Like" relevance ranking — pure and DB-free, so it is unit-tested
 * without a database (see tests/related-logic.test.mts) and reused by the
 * `getRelatedPosts` query.
 *
 * Preference order, matching the product spec:
 *   1. Same post type  — market-watch vs. regular article (our only "category"
 *      signal; there is no category column, so type is derived from tags).
 *   2. More shared tags — overlap with the current post's tags.
 *   3. Most recent      — the incoming candidate order is already newest-first,
 *      so ties fall back to recency via a STABLE sort.
 *
 * Candidates must already be the public-visible pool with the current post
 * excluded (the query enforces: published/scheduled-due, not archived, not the
 * current post, not future) — this function only ranks and slices.
 */

const MARKET_WATCH = new Set(["market-watch", "market-pulse"]);

/** A post is "Market Watch" type when it carries a market-watch/-pulse tag. */
export function isMarketWatchTags(tags: readonly { slug: string }[]): boolean {
  return tags.some((t) => MARKET_WATCH.has(t.slug));
}

type Tagged = { tags: readonly { slug: string }[] };

export function rankRelated<T extends Tagged>(
  current: Tagged,
  candidates: readonly T[],
  limit = 2,
): T[] {
  const currentSlugs = new Set(current.tags.map((t) => t.slug));
  const currentType = isMarketWatchTags(current.tags);

  // Score with type as the dominant term (weight far above any achievable shared
  // count), shared-tag overlap second. Equal scores keep the incoming (recency)
  // order because the index tiebreak preserves it and the sort is stable.
  const scored = candidates.map((c, i) => {
    const sharedTags = c.tags.reduce((n, t) => n + (currentSlugs.has(t.slug) ? 1 : 0), 0);
    const sameType = isMarketWatchTags(c.tags) === currentType;
    return { c, i, score: (sameType ? 1000 : 0) + sharedTags };
  });

  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, limit).map((s) => s.c);
}
