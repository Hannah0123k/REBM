import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { ArticleGrid } from "@/components/blog/ArticleGrid";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import {
  getFeaturedPost as getPlaceholderFeatured,
  getGridPosts as getPlaceholderGrid,
} from "@/content/blog-placeholders";
import { cardFromPlaceholder, cardFromPost, type CardPost } from "@/lib/blog/cardView";
import { getFeaturedPost, getPublishedPosts } from "@/lib/blog/queries";

/** Featured Market Watch leads page 1; six article cards per page beneath it. */
const GRID_SIZE = 6;

/**
 * Serve this page from cache and refresh it in the background at most once a
 * minute, instead of re-rendering and re-querying Supabase for every visitor.
 * Before this, /blog was `x-vercel-cache: MISS` on every request (0.28-0.99s
 * TTFB, up to 2.4s total) while the cached homepage answered in ~0.17s.
 *
 * The trade: a post whose scheduled time passes becomes visible within a minute
 * rather than on the very next request. Publishing is not a real-time operation,
 * so a minute is a fair price for making every reader's load fast. Raise this if
 * the blog gets quieter; lower it only with a reason.
 */
export const revalidate = 60;

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
 * centered container (~1in side margins on a 13" screen).
 */
export default async function BlogPage() {
  let featured: CardPost | null = null;
  let posts: CardPost[] = [];
  let excludeId: string | undefined;
  let hasMore = false;

  try {
    const featuredReal = await getFeaturedPost();
    if (!featuredReal) throw new Error("no published posts yet");
    const { posts: gridPosts, totalPages } = await getPublishedPosts({
      page: 1,
      pageSize: GRID_SIZE,
      excludeId: featuredReal.id,
    });
    featured = cardFromPost(featuredReal);
    posts = gridPosts.map(cardFromPost);
    excludeId = featuredReal.id;
    hasMore = totalPages > 1; // remaining pages load INLINE via ArticleGrid
  } catch {
    // Nothing published yet (or a transient read error) → show the reviewable
    // placeholder layout rather than a blank page or a 500.
    featured = cardFromPlaceholder(getPlaceholderFeatured());
    posts = getPlaceholderGrid().map(cardFromPlaceholder);
    hasMore = false; // no real page 2 yet
  }

  return (
    <>
      <main id="main-content" className="bg-white">
        {/* Photo hero band — matches the HOMEPAGE hero's light brand-blue (#689ECF)
            treatment, NOT a dark navy overlay. Only a light blue tint sits over
            the building photo so the image stays clearly visible and the band
            reads lighter than the navy REBM logo. A gentle vertical deepening
            plus a soft shadow on the title keep the centered white "Our Blogs"
            readable without darkening the image. */}
        {/* Mobile/tablet: pt = header height so the title is EXACTLY centred
            between the nav's bottom and the band's bottom ((B+headerH)/2 =
            (navBottom+B)/2). Desktop keeps pt-[81px], which matches the live
            site's hero (title centreY 236, sitting a touch above the geometric
            centre). */}
        <section className="relative flex min-h-[170px] w-full items-center justify-center overflow-hidden bg-rebm-blue pt-[40px] sm:min-h-[340px] sm:pt-[var(--header-h)] lg:min-h-[391px] lg:pt-[81px]">
          {/* Background photo framed EXACTLY like the live site (image-3.png,
              same 1920×384 asset): natural size (background-size:auto — not cover,
              no scale) anchored top-left (0% 0%), so the same visible portion and
              focal point show. Left-top anchor keeps the focal point consistent
              across desktop/tablet/mobile (narrower viewports reveal the left of
              the image at 1:1, matching the live crop). */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/assets/live/blog-hero.png')",
              backgroundSize: "auto",
              backgroundPosition: "left top",
              backgroundRepeat: "repeat",
            }}
          />
          {/* Brand-blue film (#689ECF) — thinned substantially so the building
              photograph is clearly visible. Still a light REBM-blue film (not
              transparent, not navy). White title legibility is protected by a
              slightly stronger text-shadow, NOT by darkening the film. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(104,158,207,0.22) 0%, rgba(104,158,207,0.30) 55%, rgba(104,158,207,0.38) 100%)",
            }}
          />
          <Container className="relative text-center">
            <h1 className="text-[40px] leading-[48px] font-bold tracking-[-0.2px] text-white [text-shadow:0_2px_5px_rgba(3,44,64,0.6),0_2px_20px_rgba(3,44,64,0.5)] sm:text-[52px] sm:leading-[62px] lg:text-[62px] lg:leading-[74px]">
              Our Blogs
            </h1>
          </Container>
        </section>

        {/* Blog content container — reproduces the LIVE site's blog boxed width
            EXACTLY (measured with Playwright at 390/768/1280/1440/1920):
              cap 1226px · gutters 32 (mobile) / 42 (tablet) / 64 (desktop).
              min(1226, 100%-64)  → 390: 326 (g32) ✓
              md min(1226,100%-84) → 768: 684 (g42) ✓
              lg min(1226,100%-128)→ 1280:1152 (g64) · 1440/1920: 1226 ✓
            Featured, grid and More Articles all live inside it, so the grid
            starts/ends on the exact same left/right boundaries as the featured
            block — not a bespoke editorial wrapper, the live container. */}
        <div className="mx-auto w-[min(1226px,100%-64px)] pt-[60px] pb-[80px] md:w-[min(1226px,100%-84px)] md:pt-[100px] lg:w-[min(1226px,100%-128px)]">
          {featured && <FeaturedBlogCard post={featured} />}

          {/* Live grid (3/2/1 cols, gap-x 48 / gap-y 70, measured) + inline
              "More Articles": subsequent pages append here on the same page. */}
          <ArticleGrid
            initialPosts={posts}
            hasFeatured={Boolean(featured)}
            excludeId={excludeId}
            initialHasMore={hasMore}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
