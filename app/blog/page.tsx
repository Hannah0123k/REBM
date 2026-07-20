import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import {
  getFeaturedPost as getPlaceholderFeatured,
  getGridPosts as getPlaceholderGrid,
} from "@/content/blog-placeholders";
import { cardFromPlaceholder, cardFromPost, type CardPost } from "@/lib/blog/cardView";
import { getFeaturedPost, getPublishedPosts } from "@/lib/blog/queries";

export const metadata: Metadata = {
  title: "Blog — Real Estate Broker Match",
  description:
    "Insights on commercial real estate, market trends, and broker matching from Real Estate Broker Match.",
};

/**
 * Public blog index. STRUCTURE mirrors the old live site (source of truth):
 *   photo hero band with a blue wash + centered "Our Blogs" → a large FEATURED
 *   post (the latest Market Watch / "Market Pulse") → the remaining posts in a
 *   grid, newest first → a "View more articles" control.
 *
 * DATA: reads published posts from Supabase (newest first). Until the WordPress
 * migration lands any real posts, it falls back to the placeholder layout so
 * the design stays reviewable. Dynamic render (Supabase via cookies) → scheduled
 * posts appear the moment their time passes.
 */
export default async function BlogPage() {
  let featured: CardPost;
  let posts: CardPost[];
  let hasMore = false;
  let isPlaceholder = false;

  try {
    const featuredReal = await getFeaturedPost();
    if (featuredReal) {
      const { posts: page, totalPages } = await getPublishedPosts({ page: 1, pageSize: 12 });
      featured = cardFromPost(featuredReal);
      posts = page.filter((p) => p.id !== featuredReal.id).map(cardFromPost);
      hasMore = totalPages > 1;
    } else {
      throw new Error("no published posts yet");
    }
  } catch {
    // No posts yet, or the store is briefly unavailable — show the reviewable
    // placeholder layout rather than a 500. Real posts take over automatically.
    isPlaceholder = true;
    featured = cardFromPlaceholder(getPlaceholderFeatured());
    posts = getPlaceholderGrid().map(cardFromPlaceholder);
  }

  return (
    <main id="main-content" className="bg-white">
      {/* Photo hero band with a brand-blue wash + centered white title. */}
      <section className="relative flex min-h-[340px] w-full items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/live/hero-bg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-rebm-blue/75" />
        <Container className="relative py-[48px] text-center">
          <h1 className="text-[46px] leading-[54px] font-bold tracking-[-0.5px] text-white sm:text-[64px] sm:leading-[72px]">
            Our Blogs
          </h1>
        </Container>
      </section>

      <Container className="pt-[72px] pb-[88px]">
        <div className="mx-auto max-w-[1200px]">
          {/* Placeholder note — only while no real posts are published yet. */}
          {isPlaceholder && (
            <p className="mb-[36px] text-center text-[13px] text-[rgb(150,160,170)]">
              Placeholder layout — real articles are added during migration.
            </p>
          )}

          {/* Featured post (Market Watch leads, as on the live site) */}
          <FeaturedBlogCard post={featured} />

          {/* Post grid, newest first */}
          {posts.length > 0 && (
            <div className="mt-[64px] grid grid-cols-1 gap-x-[40px] gap-y-[56px] sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* "View more articles" — filled brand-blue pill (Figma). Shown only
              when more pages exist; pagination route lands with migration. */}
          {(hasMore || isPlaceholder) && (
            <div className="mt-[64px] flex justify-center">
              <span
                className="inline-flex cursor-default items-center rounded-full bg-rebm-blue px-[32px] py-[13px] text-[15px] font-semibold text-white"
                title={isPlaceholder ? "Available after migration" : "Pagination coming soon"}
              >
                View more articles
              </span>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
