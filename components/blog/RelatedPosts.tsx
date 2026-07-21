import { Container } from "@/components/Container";
import { RelatedPostCard } from "@/components/blog/RelatedPostCard";
import type { CardPost } from "@/lib/blog/cardView";

/**
 * "You May Also Like" — related posts under an article. A heading, a thin blue
 * divider, then up to two horizontal RelatedPostCards side-by-side (stacked on
 * mobile). Takes already-normalized CardPosts so it renders identically for real
 * DB posts and pre-migration placeholders. Renders nothing when empty, so a thin
 * catalogue never shows an empty band.
 */
export function RelatedPosts({ posts }: { posts: CardPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="bg-white pb-[72px]">
      <Container>
        {/* Aligned EXACTLY to the article body: same Container + max-w-[760px]
            centered as the prose column, so the heading, divider and cards share
            the article text's left/right edges. */}
        <div className="mx-auto max-w-[760px]">
          <h2 id="related-title" className="text-[26px] leading-[32px] font-bold text-rebm-navy sm:text-[30px]">
            You May Also Like
          </h2>
          <hr className="mt-[16px] border-0 border-t-2 border-rebm-blue" />
          <div className="mt-[32px] grid grid-cols-1 gap-x-[40px] gap-y-[36px] sm:grid-cols-2">
            {posts.map((p) => (
              <RelatedPostCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
