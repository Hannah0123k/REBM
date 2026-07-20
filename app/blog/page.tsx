import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import { MoreArticles } from "@/components/blog/MoreArticles";
import {
  getFeaturedPost as getPlaceholderFeatured,
  getGridPosts as getPlaceholderGrid,
} from "@/content/blog-placeholders";
import { cardFromPlaceholder, cardFromPost, type CardPost } from "@/lib/blog/cardView";
import { getFeaturedPost, getPublishedPosts } from "@/lib/blog/queries";

/** Featured Market Watch leads page 1; six article cards per page beneath it. */
const GRID_SIZE = 6;

export const metadata: Metadata = {
  title: "Blog — Real Estate Broker Match",
  description:
    "Insights on commercial real estate, market trends, and broker matching from Real Estate Broker Match.",
};

/**
 * Public blog index. Photo hero band ("Our Blogs", centered) → a large FEATURED
 * Market Watch lead (page 1 only) → a 3-across grid of article cards → a "More
 * Articles" control. Reads Supabase (newest first); falls back to the reviewable
 * placeholder layout until real posts are migrated. Featured + grid share one
 * centered container (~1in side margins on a 13" screen). Dynamic render, so
 * scheduled posts appear the moment their time passes.
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);

  let featured: CardPost | null = null;
  let posts: CardPost[] = [];
  let moreHref: string | undefined;
  let isPlaceholder = false;

  try {
    const featuredReal = await getFeaturedPost();
    if (!featuredReal) throw new Error("no published posts yet");
    const { posts: gridPosts, totalPages } = await getPublishedPosts({
      page,
      pageSize: GRID_SIZE,
      excludeId: featuredReal.id,
    });
    featured = page === 1 ? cardFromPost(featuredReal) : null;
    posts = gridPosts.map(cardFromPost);
    moreHref = page < totalPages ? `/blog?page=${page + 1}` : undefined;
  } catch {
    // Empty store or a transient read error → placeholder layout, not a 500.
    isPlaceholder = true;
    featured = cardFromPlaceholder(getPlaceholderFeatured());
    posts = getPlaceholderGrid().map(cardFromPlaceholder);
    moreHref = undefined; // no real page 2 yet
  }

  return (
    <>
      <main id="main-content" className="bg-white">
        {/* Photo hero band with a brand-blue wash + centered white title. */}
        <section className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/assets/live/hero-bg.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-rebm-blue/80" />
          <Container className="relative py-[48px] text-center">
            <h1 className="text-[46px] leading-[54px] font-bold tracking-[-0.5px] text-white sm:text-[64px] sm:leading-[72px]">
              Our Blogs
            </h1>
          </Container>
        </section>

        <Container className="pt-[64px] pb-[88px]">
          {/* Featured Market Watch + grid share this one centered container. */}
          <div className="mx-auto max-w-[1320px]">
            {isPlaceholder && (
              <p className="mb-[36px] text-center text-[13px] text-[rgb(150,160,170)]">
                Placeholder layout — real articles are added during migration.
              </p>
            )}

            {featured && <FeaturedBlogCard post={featured} />}

            {posts.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-x-[36px] gap-y-[48px] sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-[56px]" : ""}`}
              >
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}

            <div className="mt-[56px] flex justify-center">
              <MoreArticles href={moreHref} />
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
