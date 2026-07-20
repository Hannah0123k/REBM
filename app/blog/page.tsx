import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import {
  getFeaturedPost as getPlaceholderFeatured,
  getGridPosts as getPlaceholderGrid,
} from "@/content/blog-placeholders";
import { cardFromPlaceholder, cardFromPost, type CardPost } from "@/lib/blog/cardView";
import { getFeaturedPost, getPublishedPosts } from "@/lib/blog/queries";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Blog — Real Estate Broker Match",
  description:
    "Insights on commercial real estate, market trends, and broker matching from Real Estate Broker Match.",
};

/**
 * Public blog index. Photo hero band → (page 1) featured post → grid of posts,
 * newest first → search + prev/next pagination. Reads Supabase; falls back to
 * the reviewable placeholder layout until real posts are migrated. Dynamic
 * render, so scheduled posts appear the moment their time passes.
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const q = (sp.q ?? "").trim();
  const isDefault = page === 1 && !q;

  let featured: CardPost | null = null;
  let posts: CardPost[] = [];
  let totalPages = 1;
  let isPlaceholder = false;

  try {
    if (isDefault) {
      const featuredReal = await getFeaturedPost();
      if (!featuredReal) throw new Error("no published posts yet");
      const { posts: pagePosts, totalPages: tp } = await getPublishedPosts({ page: 1, pageSize: PAGE_SIZE });
      featured = cardFromPost(featuredReal);
      posts = pagePosts.filter((p) => p.id !== featuredReal.id).map(cardFromPost);
      totalPages = tp;
    } else {
      const { posts: pagePosts, totalPages: tp } = await getPublishedPosts({ page, pageSize: PAGE_SIZE, search: q || undefined });
      posts = pagePosts.map(cardFromPost);
      totalPages = tp;
    }
  } catch {
    if (isDefault) {
      // Empty store or a transient read error → placeholder layout, not a 500.
      isPlaceholder = true;
      featured = cardFromPlaceholder(getPlaceholderFeatured());
      posts = getPlaceholderGrid().map(cardFromPlaceholder);
    }
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
          <BlogSearch q={q} />

          {q && (
            <p className="mb-[36px] text-center text-[15px] text-[rgb(90,102,114)]">
              {posts.length > 0
                ? `Results for “${q}”`
                : `No articles found for “${q}”.`}
            </p>
          )}

          {isPlaceholder && (
            <p className="mb-[36px] text-center text-[13px] text-[rgb(150,160,170)]">
              Placeholder layout — real articles are added during migration.
            </p>
          )}

          {featured && <FeaturedBlogCard post={featured} />}

          {posts.length > 0 && (
            <div className={`grid grid-cols-1 gap-x-[40px] gap-y-[56px] sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-[64px]" : ""}`}>
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {!isPlaceholder && (
            <BlogPagination page={page} totalPages={totalPages} query={q || undefined} />
          )}

          {/* Placeholder-only inert control (no real posts yet). */}
          {isPlaceholder && (
            <div className="mt-[64px] flex justify-center">
              <span
                className="inline-flex cursor-default items-center rounded-full bg-rebm-blue px-[32px] py-[13px] text-[15px] font-semibold text-white"
                title="Available after migration"
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
