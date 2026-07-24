import Link from "next/link";

import { CoverImage } from "@/components/blog/CoverImage";
import { BLOG_COVER_ASPECT, cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Regular article card for the grid. The cover uses the SAME aspect ratio as
 * the article/related covers (BLOG_COVER_ASPECT, 1564/942) so the cover artwork —
 * including its top/bottom border edges — shows fully and identically everywhere;
 * a different ratio here would object-cover-trim those edges. Then the excerpt,
 * with the publication date in brand teal at the bottom. The VISIBLE title is
 * intentionally omitted — the cover artwork already contains the title, so
 * repeating it beneath the thumbnail would be redundant. The title still reaches
 * assistive tech via the link's aria-label (and lives on in SEO/DB/slug). No
 * category or author on the public listing (per the approved design). The whole
 * card links to the post; hover/focus lift it and nudge the cover, respecting
 * reduced motion. A broken cover falls back to the placeholder (CoverImage).
 */
export function BlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);

  const body = (
    <article className="flex h-full flex-col">
      <div className="overflow-hidden rounded-[16px]">
        <div className="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none">
          <CoverImage
            url={p.imageUrl}
            alt={p.imageAlt}
            aspect={BLOG_COVER_ASPECT}
            tone={p.isMarketWatch ? "blue" : "light"}
            rounded="rounded-[16px]"
          />
        </div>
      </div>
      <div className="mt-[14px] flex flex-1 flex-col">
        {p.excerpt && (
          <p className="line-clamp-3 text-[15px] leading-[24px] text-[rgb(70,82,94)]">{p.excerpt}</p>
        )}
        <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-auto pt-[14px] text-[14px] font-semibold text-[#6ec1e4]">
          {formatPublishedDate(p.dateIso)}
        </time>
      </div>
    </article>
  );

  if (p.href === "#") return body;
  return (
    <Link
      href={p.href}
      aria-label={p.title}
      className="group block h-full rounded-[18px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[3px] hover:drop-shadow-[0_12px_24px_rgba(3,44,64,0.10)] focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
    >
      {body}
    </Link>
  );
}
