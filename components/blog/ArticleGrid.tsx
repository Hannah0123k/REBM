"use client";

import { useState, useTransition } from "react";

import { BlogCard } from "@/components/blog/BlogCard";
import { loadMoreArticles } from "@/app/blog/actions";
import type { CardPost } from "@/lib/blog/cardView";

/**
 * The article grid + INLINE "More Articles" control. The first page is rendered
 * on the server and passed in as `initialPosts`; clicking "More Articles" fetches
 * the next page via a server action and APPENDS it to the same grid — no page
 * navigation, no reload. New cards fade up in place, and existing cards never
 * move (content only grows downward → no layout shift). The button hides itself
 * once there are no more pages.
 */
const BUTTON =
  "inline-flex min-w-[220px] items-center justify-center gap-[8px] rounded-full bg-rebm-navy px-[40px] py-[15px] text-[16px] font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none";

export function ArticleGrid({
  initialPosts,
  hasFeatured,
  excludeId,
  initialHasMore,
}: {
  initialPosts: CardPost[];
  hasFeatured: boolean;
  excludeId?: string;
  initialHasMore: boolean;
}) {
  const [posts, setPosts] = useState<CardPost[]>(initialPosts);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState(false);
  // Index from which cards are newly appended (so only they animate in).
  const [freshFrom, setFreshFrom] = useState(initialPosts.length);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    setError(false);
    startTransition(async () => {
      try {
        const res = await loadMoreArticles(nextPage, excludeId);
        setFreshFrom(posts.length);
        setPosts((prev) => [...prev, ...res.cards]);
        setNextPage((n) => n + 1);
        setHasMore(res.hasMore);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <>
      {posts.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-x-[48px] gap-y-[70px] md:grid-cols-2 lg:grid-cols-3 ${
            hasFeatured ? "mt-[40px] lg:mt-[60px]" : ""
          }`}
        >
          {posts.map((post, i) => (
            <div key={post.id} className={i >= freshFrom ? "rebm-enter" : ""}>
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      )}

      {(hasMore || error) && (
        <div className="mt-[60px] flex flex-col items-center gap-[12px]">
          <button type="button" onClick={loadMore} disabled={pending} aria-busy={pending} className={BUTTON}>
            {pending ? "Loading…" : "More Articles"}
            {!pending && <span aria-hidden="true">→</span>}
          </button>
          {error && (
            <p role="alert" className="text-[14px] text-red-600">
              Couldn’t load more articles — please try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
