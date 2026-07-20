import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import type { CardPost } from "@/lib/blog/cardView";

/**
 * "You May Also Like" — related posts under an article. Takes already-normalized
 * CardPosts so it renders the SAME clickable BlogCard for real DB posts and
 * pre-migration placeholders alike. Renders nothing when empty, so a thin
 * catalogue never shows an empty band.
 */
export function RelatedPosts({ posts }: { posts: CardPost[] }) {
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
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
