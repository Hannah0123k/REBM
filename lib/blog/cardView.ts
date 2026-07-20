import type { BlogPlaceholder } from "@/content/blog-placeholders";
import type { PublicPostCard } from "@/lib/blog/queries";

/**
 * Normalized view-model the blog cards render, so the SAME card components work
 * for real DB posts and the pre-migration placeholders. `href === "#"` marks an
 * inert placeholder (no post route yet); image/author URLs `null` fall back to
 * the ThumbPlaceholder cover / initials avatar.
 */
export type CardPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  href: string;
  dateIso: string;
  imageUrl: string | null;
  imageAlt: string;
  authorName: string;
  authorImageUrl: string | null;
  isMarketWatch: boolean;
};

const MARKET_WATCH = new Set(["market-watch", "market-pulse"]);

export function cardFromPost(p: PublicPostCard): CardPost {
  const isMarketWatch = p.tags.some((t) => MARKET_WATCH.has(t.slug));
  return {
    id: p.id,
    category: isMarketWatch ? "Market Watch" : (p.tags[0]?.name ?? "Article"),
    title: p.title,
    excerpt: p.excerpt ?? "",
    href: `/blog/${p.slug}`,
    dateIso: p.published_at,
    imageUrl: p.featured_image_url,
    imageAlt: p.featured_image_alt || p.title,
    authorName: p.author_name ?? "",
    authorImageUrl: p.author_image_url,
    isMarketWatch,
  };
}

export function cardFromPlaceholder(p: BlogPlaceholder): CardPost {
  return {
    id: p.id,
    category: p.category,
    title: p.title,
    excerpt: p.excerpt,
    href: p.href,
    dateIso: p.date,
    imageUrl: null,
    imageAlt: p.title,
    authorName: p.author,
    authorImageUrl: null,
    isMarketWatch: p.type === "market-watch",
  };
}
