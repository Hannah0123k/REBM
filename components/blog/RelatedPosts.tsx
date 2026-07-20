import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import { cardFromPost } from "@/lib/blog/cardView";
import type { PublicPostCard } from "@/lib/blog/queries";

/**
 * "You May Also Like" — related published posts under an article. Reuses the
 * clickable BlogCard. Renders nothing when there are no other published posts,
 * so a thin catalogue never shows an empty band.
 */
export function RelatedPosts({ posts }: { posts: PublicPostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="border-t border-rebm-card-border bg-[#FAFBFC]">
      <Container className="py-[64px]">
        <div className="mx-auto max-w-[1400px]">
          <h2 id="related-title" className="text-[26px] leading-[32px] font-bold text-rebm-navy sm:text-[30px]">
            You May Also Like
          </h2>
          <div className="mt-[32px] grid grid-cols-1 gap-x-[40px] gap-y-[48px] sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.id} post={cardFromPost(p)} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
