import { resolveAuthorImage } from "@/lib/blog/authors";
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

/**
 * Every blog cover (featured, grid card, post-page hero) reserves the EXACT
 * aspect ratio of the finalized production artwork — 1564×942 (≈1.66:1) — so
 * uploaded images drop in with essentially zero layout shift. One source of
 * truth for the whole blog system.
 */
export const BLOG_COVER_ASPECT = "aspect-[1564/942]";

/**
 * The same 1564×942 cover artwork, as raw numbers — for the admin crop editor,
 * which needs the numeric ratio (and target output pixels) to enforce the crop
 * box and render the cropped image. Kept next to BLOG_COVER_ASPECT so the CSS
 * aspect and the crop aspect can never drift apart.
 */
export const BLOG_COVER_W = 1564;
export const BLOG_COVER_H = 942;
export const BLOG_COVER_RATIO = BLOG_COVER_W / BLOG_COVER_H; // ≈ 1.6603

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
    // Image derived from the author name (registry) so name↔image never mismatch
    // and posts with a null stored URL still show the right photo. See authors.ts.
    authorImageUrl: resolveAuthorImage(p.author_name, p.author_image_url),
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
