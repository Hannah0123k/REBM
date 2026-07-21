import Link from "next/link";

import { CoverImage } from "@/components/blog/CoverImage";
import { BLOG_COVER_ASPECT, type CardPost } from "@/lib/blog/cardView";

/**
 * "You May Also Like" item (Post page only): a LARGE cover thumbnail that fills
 * the card column, with the excerpt left-aligned directly beneath it. The visible
 * title is omitted — the cover artwork already contains it — so the card mirrors
 * the main Our Blogs cards rather than repeating the title beside a small icon.
 * The cover uses the shared BLOG_COVER_ASPECT (1564/942) so both related cards
 * are equal width and image height. The whole card links to the post; the title
 * stays available to assistive tech via aria-label. Hover lifts it slightly. A
 * broken/empty cover falls back to the tinted placeholder via CoverImage.
 */
export function RelatedPostCard({ post }: { post: CardPost }) {
  const body = (
    <article className="flex flex-col">
      <div className="overflow-hidden rounded-[16px]">
        <div className="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none">
          <CoverImage
            url={post.imageUrl}
            alt={post.imageAlt}
            aspect={BLOG_COVER_ASPECT}
            tone={post.isMarketWatch ? "blue" : "light"}
            rounded="rounded-[16px]"
          />
        </div>
      </div>
      {post.excerpt && (
        <p className="mt-[16px] line-clamp-3 text-left text-[15px] leading-[24px] text-[rgb(70,82,94)]">
          {post.excerpt}
        </p>
      )}
    </article>
  );

  if (post.href === "#") return body;
  return (
    <Link
      href={post.href}
      aria-label={post.title}
      className="group block rounded-[18px] transition-[transform] duration-300 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
    >
      {body}
    </Link>
  );
}
