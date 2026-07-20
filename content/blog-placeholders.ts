/**
 * TEMPORARY placeholder blog data — replaced during the WordPress migration.
 * =========================================================================
 * Lets the FULL public blog experience (listing + article pages) be built,
 * navigated, and reviewed before real articles are imported. The public pages
 * read Supabase first (lib/blog/queries.ts) and fall back to this catalogue when
 * nothing is published yet. Shape mirrors the live site: one large FEATURED
 * Market Watch item, then six regular article cards.
 *
 * HONESTY: this is scaffolding, not migrated content.
 *  - Author names are intentionally BLANK — we do not invent authors. Real
 *    author data arrives with the migration; until then no author is displayed.
 *  - Dates are placeholder scaffolding purely so the card/date layout can be
 *    reviewed; they are not real publication dates.
 *  - Article bodies are generic, evergreen prose with NO fabricated figures,
 *    tables, or Market Pulse data, and each carries a visible placeholder note.
 * Every item has a real `slug`, so its card navigates to a working
 * `/blog/[slug]` placeholder article route (no dead "#" links).
 */

export type BlogPostType = "article" | "market-watch";

/** A block of placeholder article body — a heading or a paragraph. */
export type PlaceholderBlock = { kind: "h2" | "p"; text: string };

export type BlogPlaceholder = {
  id: string;
  /** URL slug — resolves at /blog/[slug] via the placeholder fallback. */
  slug: string;
  type: BlogPostType;
  /** Small label shown on the card (post type / category). */
  category: string;
  title: string;
  excerpt: string;
  /** Author display name — intentionally blank (we never invent authors). */
  author: string;
  /** ISO date; placeholder scaffolding for ordering + the displayed date only. */
  date: string;
  /** Post URL — always a real route now (/blog/{slug}). */
  href: string;
};

function make(p: Omit<BlogPlaceholder, "href" | "author">): BlogPlaceholder {
  return { ...p, author: "", href: `/blog/${p.slug}` };
}

/** One prominent Market Watch feature. */
export const FEATURED_PLACEHOLDER: BlogPlaceholder = make({
  id: "mw-latest",
  slug: "rebm-market-pulse-preview",
  type: "market-watch",
  category: "Market Watch",
  title: "REBM Market Pulse — Preview",
  excerpt:
    "A preview of REBM's monthly read on commercial real estate: where interest rates, deal flow, and buyer demand are heading — and what it means for sellers this quarter.",
  date: "2026-02-03",
});

/** Six regular article placeholders, newest first. */
export const ARTICLE_PLACEHOLDERS: BlogPlaceholder[] = [
  make({
    id: "post-1",
    slug: "what-industrial-property-buyers-look-for",
    type: "article",
    category: "Industrial",
    title: "What Industrial Property Buyers Look For",
    excerpt: "The location, logistics, and tenant factors driving demand for warehouse and distribution assets.",
    date: "2026-01-26",
  }),
  make({
    id: "post-2",
    slug: "selling-office-space-in-a-hybrid-work-era",
    type: "article",
    category: "Office",
    title: "Selling Office Space in a Hybrid-Work Era",
    excerpt: "How owners are repositioning office assets and pricing them for today's very different buyer pool.",
    date: "2026-01-23",
  }),
  make({
    id: "post-3",
    slug: "how-multifamily-buyers-underwrite-a-deal",
    type: "article",
    category: "Multifamily",
    title: "How Multifamily Buyers Underwrite a Deal",
    excerpt: "Rent rolls, cap rates, and expense assumptions — the numbers investors run before they make an offer.",
    date: "2026-01-22",
  }),
  make({
    id: "post-4",
    slug: "interest-rates-and-commercial-pricing",
    type: "article",
    category: "Financing",
    title: "Interest Rates and Commercial Pricing",
    excerpt: "A seller's guide to how the rate environment moves valuations up and down across asset classes.",
    date: "2025-12-18",
  }),
  make({
    id: "post-5",
    slug: "understanding-cap-rates-in-todays-market",
    type: "article",
    category: "Valuation",
    title: "Understanding Cap Rates in Today's Market",
    excerpt: "What a cap rate really tells you about risk, income, and the price a property should command.",
    date: "2025-12-09",
  }),
  make({
    id: "post-6",
    slug: "why-some-listings-sit-unsold-for-months",
    type: "article",
    category: "Selling",
    title: "Why Some Listings Sit Unsold for Months",
    excerpt: "The pricing, marketing, and broker-fit mistakes that stall a sale — and how to avoid them.",
    date: "2025-11-20",
  }),
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

/** Look up a placeholder by its slug (for the /blog/[slug] fallback route). */
export function getPlaceholderBySlug(slug: string): BlogPlaceholder | undefined {
  return BLOG_PLACEHOLDERS.find((p) => p.slug === slug);
}

/** Related placeholders for the bottom of an article — newest first, current excluded. */
export function getRelatedPlaceholders(excludeId: string, limit = 3): BlogPlaceholder[] {
  return BLOG_PLACEHOLDERS.filter((p) => p.id !== excludeId).slice(0, limit);
}

/**
 * Generic, evergreen placeholder body for an article page. Deliberately contains
 * NO fabricated statistics, tables, dates, or Market Pulse figures — just the
 * shape of a real article so spacing/typography can be reviewed.
 */
export function getPlaceholderBody(p: BlogPlaceholder): PlaceholderBlock[] {
  return [
    { kind: "p", text: p.excerpt },
    { kind: "h2", text: "What sellers should know" },
    {
      kind: "p",
      text:
        "Every commercial property tells a story through its numbers, its location, and its tenants. Understanding how a prospective buyer reads that story is the first step toward a smooth, well-priced sale — and toward choosing a broker who can tell it convincingly.",
    },
    {
      kind: "p",
      text:
        "The right representation reframes a listing around the factors buyers actually weigh, sets expectations early, and keeps momentum through diligence. That is the difference between a property that lingers and one that moves.",
    },
    { kind: "h2", text: "How Real Estate Broker Match helps" },
    {
      kind: "p",
      text:
        "REBM matches owners with a hand-selected, expert broker for their specific asset type and market — so sellers get representation that fits the property, not a one-size-fits-all pitch. Final articles and Market Pulse editions will appear here once the content migration is complete.",
    },
  ];
}

/** Format an ISO date as the live site shows it, e.g. "February 3, 2026". */
export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
