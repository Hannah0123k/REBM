"use server";

import { cardFromPost, type CardPost } from "@/lib/blog/cardView";
import { getPublishedPosts } from "@/lib/blog/queries";

/** Grid page size — must match the initial server render in app/blog/page.tsx. */
const GRID_SIZE = 6;

/**
 * Fetch the next page of grid articles for the INLINE "More Articles" control.
 * Same visibility rules, ordering and page size as the initial listing, and it
 * keeps excluding the featured post so it never duplicates. Returns whether more
 * pages remain so the button can hide itself.
 */
export async function loadMoreArticles(
  page: number,
  excludeId?: string,
): Promise<{ cards: CardPost[]; hasMore: boolean }> {
  const safePage = Math.max(2, Math.floor(page) || 2);
  const { posts, totalPages } = await getPublishedPosts({
    page: safePage,
    pageSize: GRID_SIZE,
    excludeId,
  });
  return { cards: posts.map(cardFromPost), hasMore: safePage < totalPages };
}
