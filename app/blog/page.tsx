import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import { getFeaturedPost, getGridPosts } from "@/content/blog-placeholders";

export const metadata: Metadata = {
  title: "Blog — Real Estate Broker Match",
  description:
    "Insights on commercial real estate, market trends, and broker matching from Real Estate Broker Match.",
};

/**
 * Public blog index. STRUCTURE mirrors the old live site (source of truth):
 *   "Our Blogs" heading → a large FEATURED post at the top (the latest Market
 *   Watch / "Market Pulse" item) → the remaining posts in a grid, newest first
 *   → a "View more articles" control.
 *
 * STYLING is the current brand (navy/blue, Inter, shared Container + card
 * system). Content is placeholder only — see content/blog-placeholders.ts;
 * nothing links out yet, so there are no dead post routes.
 */
export default function BlogPage() {
  const featured = getFeaturedPost();
  const posts = getGridPosts();

  return (
    <main id="main-content" className="bg-white">
      {/* Hero */}
      <section className="w-full pt-[calc(var(--header-h)+40px)] pb-[8px]">
        <Container className="text-center">
          <h1 className="text-[34px] leading-[40px] font-bold tracking-[-0.4px] text-rebm-navy sm:text-[46px] sm:leading-[54px]">
            Our Blogs
          </h1>
          <p className="mx-auto mt-[12px] max-w-[620px] text-[16px] leading-[24px] text-[rgb(60,72,84)]">
            Insights on commercial real estate, market trends, and broker matching.
          </p>
          <p className="mx-auto mt-[8px] text-[13px] text-[rgb(140,150,162)]">
            Placeholder layout — real articles are added during migration.
          </p>
        </Container>
      </section>

      <Container className="pt-[36px] pb-[80px]">
        <div className="mx-auto max-w-[1200px]">
          {/* Featured post (Market Watch leads, as on the live site) */}
          <FeaturedBlogCard post={featured} />

          {/* Post grid, newest first */}
          <div className="mt-[48px] grid grid-cols-1 gap-x-[32px] gap-y-[40px] sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* "View more articles" — inert until pagination/real posts exist. */}
          <div className="mt-[56px] flex justify-center">
            <span
              className="inline-flex cursor-default items-center rounded-full border border-rebm-navy/25 px-[30px] py-[13px] text-[15px] font-semibold text-rebm-navy/70"
              title="Available after migration"
            >
              View more articles
            </span>
          </div>
        </div>
      </Container>
    </main>
  );
}
