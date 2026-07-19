/**
 * TEMPORARY placeholder blog data — replace during the WordPress migration.
 * =========================================================================
 * This file exists so the /blog LAYOUT can be built and reviewed before the
 * real articles are imported. Swap the entries (or point the selectors at the
 * real content store / Supabase) WITHOUT touching the page or card components.
 *
 * Structure mirrors the OLD live site (source of truth for blog structure):
 *   "Our Blogs" heading → one large FEATURED post at the top (the latest
 *   Market Watch / "Market Pulse" item) → the remaining posts in a grid, newest
 *   first → a "View more articles" control.
 *
 * Nothing here is real copy. Titles/excerpts are obvious placeholders; dates are
 * plausible so ordering can be seen. `href` is "#" until real post routes exist.
 */

export type BlogPostType = "article" | "market-watch";

export type BlogPlaceholder = {
  id: string;
  type: BlogPostType;
  /** Small label shown on the card (post type / category). */
  category: string;
  title: string;
  excerpt: string;
  /** ISO date; used for ordering and the displayed published date. */
  date: string;
  /** Future post URL — "#" while migration is pending (no dead 404 route). */
  href: string;
};

const MIGRATION_EXCERPT = "Article content will be added during migration.";

/**
 * One entry per future post. The single `market-watch` item with the newest
 * date becomes the featured post (matching the live site, where the latest
 * Market Pulse leads the page); older Market Watch items sit in the grid by date.
 */
export const BLOG_PLACEHOLDERS: BlogPlaceholder[] = [
  {
    id: "mw-latest",
    type: "market-watch",
    category: "Market Watch",
    title: "Market Watch Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2026-02-03",
    href: "#",
  },
  {
    id: "post-1",
    type: "article",
    category: "Article",
    title: "Blog Post Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2026-01-26",
    href: "#",
  },
  {
    id: "post-2",
    type: "article",
    category: "Article",
    title: "Blog Post Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2026-01-23",
    href: "#",
  },
  {
    id: "post-3",
    type: "article",
    category: "Article",
    title: "Blog Post Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2026-01-22",
    href: "#",
  },
  {
    id: "mw-older",
    type: "market-watch",
    category: "Market Watch",
    title: "Market Watch Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2026-01-06",
    href: "#",
  },
  {
    id: "post-4",
    type: "article",
    category: "Article",
    title: "Blog Post Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2025-12-18",
    href: "#",
  },
  {
    id: "post-5",
    type: "article",
    category: "Article",
    title: "Blog Post Placeholder",
    excerpt: MIGRATION_EXCERPT,
    date: "2025-12-09",
    href: "#",
  },
];

const byDateDesc = (a: BlogPlaceholder, b: BlogPlaceholder) => b.date.localeCompare(a.date);

/**
 * The featured post: the newest Market Watch item (matches the live site's
 * featured-Market-Pulse-on-top treatment). Falls back to the newest post.
 */
export function getFeaturedPost(): BlogPlaceholder {
  const marketWatch = BLOG_PLACEHOLDERS.filter((p) => p.type === "market-watch").sort(byDateDesc);
  return marketWatch[0] ?? [...BLOG_PLACEHOLDERS].sort(byDateDesc)[0];
}

/** Every other post, newest first, for the grid below the featured post. */
export function getGridPosts(): BlogPlaceholder[] {
  const featuredId = getFeaturedPost().id;
  return BLOG_PLACEHOLDERS.filter((p) => p.id !== featuredId).sort(byDateDesc);
}

/** Format an ISO date as the live site shows it, e.g. "February 3, 2026". */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
