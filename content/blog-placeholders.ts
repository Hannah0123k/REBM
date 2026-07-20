/**
 * TEMPORARY placeholder blog data — replaced during the WordPress migration.
 * =========================================================================
 * Lets the /blog LAYOUT be built and reviewed before real articles are
 * imported. The public page reads Supabase first (lib/blog/queries.ts) and only
 * falls back to this when nothing is published yet. Shape mirrors the live
 * site's structure: one large FEATURED Market Watch item, then six regular
 * article cards, then a "More Articles" control.
 *
 * Content is placeholder but professional (no lorem ipsum) so the hierarchy and
 * spacing read true. `href` is "#" until real post routes exist (no dead 404s).
 */

export type BlogPostType = "article" | "market-watch";

export type BlogPlaceholder = {
  id: string;
  type: BlogPostType;
  /** Small label shown on the card (post type / category). */
  category: string;
  title: string;
  excerpt: string;
  /** Author display name; photo falls back to initials on the public card. */
  author: string;
  /** ISO date; used for ordering and the displayed published date. */
  date: string;
  /** Future post URL — "#" while migration is pending (no dead 404 route). */
  href: string;
};

/** One prominent Market Watch feature. */
export const FEATURED_PLACEHOLDER: BlogPlaceholder = {
  id: "mw-latest",
  type: "market-watch",
  category: "Market Watch",
  title: "REBM Market Pulse — February 2026",
  excerpt:
    "Our monthly read on commercial real estate: where interest rates, deal flow, and buyer demand are heading — and what it means for sellers this quarter.",
  author: "Alan Fruitman",
  date: "2026-02-03",
  href: "#",
};

/** Six regular article placeholders, newest first. */
export const ARTICLE_PLACEHOLDERS: BlogPlaceholder[] = [
  {
    id: "post-1",
    type: "article",
    category: "Industrial",
    title: "What Industrial Property Buyers Look For",
    excerpt: "The location, logistics, and tenant factors driving demand for warehouse and distribution assets.",
    author: "Rhett Fruitman",
    date: "2026-01-26",
    href: "#",
  },
  {
    id: "post-2",
    type: "article",
    category: "Office",
    title: "Selling Office Space in a Hybrid-Work Era",
    excerpt: "How owners are repositioning office assets and pricing them for today's very different buyer pool.",
    author: "Alan Fruitman",
    date: "2026-01-23",
    href: "#",
  },
  {
    id: "post-3",
    type: "article",
    category: "Multifamily",
    title: "How Multifamily Buyers Underwrite a Deal",
    excerpt: "Rent rolls, cap rates, and expense assumptions — the numbers investors run before they make an offer.",
    author: "Rhett Fruitman",
    date: "2026-01-22",
    href: "#",
  },
  {
    id: "post-4",
    type: "article",
    category: "Financing",
    title: "Interest Rates and Commercial Pricing",
    excerpt: "A seller's guide to how the rate environment moves valuations up and down across asset classes.",
    author: "Alan Fruitman",
    date: "2025-12-18",
    href: "#",
  },
  {
    id: "post-5",
    type: "article",
    category: "Valuation",
    title: "Understanding Cap Rates in Today's Market",
    excerpt: "What a cap rate really tells you about risk, income, and the price a property should command.",
    author: "Rhett Fruitman",
    date: "2025-12-09",
    href: "#",
  },
  {
    id: "post-6",
    type: "article",
    category: "Selling",
    title: "Why Some Listings Sit Unsold for Months",
    excerpt: "The pricing, marketing, and broker-fit mistakes that stall a sale — and how to avoid them.",
    author: "Alan Fruitman",
    date: "2025-11-20",
    href: "#",
  },
];

/** All placeholders (featured first), newest-first for any generic use. */
export const BLOG_PLACEHOLDERS: BlogPlaceholder[] = [FEATURED_PLACEHOLDER, ...ARTICLE_PLACEHOLDERS];

/** The featured Market Watch item at the top of the index. */
export function getFeaturedPost(): BlogPlaceholder {
  return FEATURED_PLACEHOLDER;
}

/** The six regular article cards beneath the feature, newest first. */
export function getGridPosts(): BlogPlaceholder[] {
  return ARTICLE_PLACEHOLDERS;
}

/** Format an ISO date as the live site shows it, e.g. "February 3, 2026". */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
