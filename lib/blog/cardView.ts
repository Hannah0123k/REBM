import type { BlogPlaceholder } from "@/content/blog-placeholders";
import type { PublicPostCard } from "@/lib/blog/queries";

/**
 * Normalized view-model the blog cards render, so the SAME card components work
 * for real DB posts and the pre-migration placeholders. `href === "#"` marks an
 * inert placeholder (no post route yet); `imageUrl === null` falls back to the
 * ThumbPlaceholder cover.
 */
export type CardPost = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  dateIso: string;
  imageUrl: string | null;
  imageAlt: string;
  isMarketWatch: boolean;
};

const MARKET_WATCH = new Set(["market-watch", "market-pulse"]);

export function cardFromPost(p: PublicPostCard): CardPost {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt ?? "",
    href: `/blog/${p.slug}`,
    dateIso: p.published_at,
    imageUrl: p.featured_image_url,
    imageAlt: p.featured_image_alt || p.title,
    isMarketWatch: p.tags.some((t) => MARKET_WATCH.has(t.slug)),
  };
}

export function cardFromPlaceholder(p: BlogPlaceholder): CardPost {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    href: p.href,
    dateIso: p.date,
    imageUrl: null,
    imageAlt: p.title,
    isMarketWatch: p.type === "market-watch",
  };
}
