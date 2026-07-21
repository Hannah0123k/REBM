import Link from "next/link";

import { CoverImage } from "@/components/blog/CoverImage";
import type { CardPost } from "@/lib/blog/cardView";

/**
 * Horizontal "You May Also Like" item (Post page only): a small rounded-square
 * thumbnail on the left, the article title to its right, and the excerpt across
 * the full width beneath. The whole item links to the post. No hover underline
 * (per the approved design) — hover just lifts the card slightly. A broken/empty
 * cover falls back to the tinted placeholder via CoverImage.
 */
export function RelatedPostCard({ post }: { post: CardPost }) {
  const body = (
    <article className="flex flex-col">
      <div className="flex items-start gap-[18px]">
        <div className="w-[104px] shrink-0 overflow-hidden rounded-[16px] sm:w-[120px]">
          <CoverImage
            url={post.imageUrl}
            alt={post.imageAlt}
            aspect="aspect-square"
            tone={post.isMarketWatch ? "blue" : "light"}
            rounded="rounded-[16px]"
          />
        </div>
        <h3 className="line-clamp-3 text-[20px] leading-[26px] font-bold text-balance text-rebm-navy sm:text-[22px] sm:leading-[28px]">
          {post.title}
        </h3>
      </div>
      {post.excerpt && (
        <p className="mt-[18px] line-clamp-3 text-[16px] leading-[26px] text-[rgb(70,82,94)]">
          {post.excerpt}
        </p>
      )}
    </article>
  );

  if (post.href === "#") return body;
  return (
    <Link
      href={post.href}
      className="group block rounded-[18px] transition-[transform] duration-300 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
    >
      {body}
    </Link>
  );
}
