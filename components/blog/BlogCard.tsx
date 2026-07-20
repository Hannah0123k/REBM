import Link from "next/link";

import { CoverImage } from "@/components/blog/CoverImage";
import { cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Regular article card for the grid. A shorter (16:9) cover, then the title and
 * excerpt, with the publication date in brand teal at the bottom. No category or
 * author on the public listing (per the approved design). The whole card links
 * to the post; hover/focus lift it and nudge the cover, respecting reduced
 * motion. A broken cover falls back to the placeholder (CoverImage) — never a
 * broken icon.
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
            aspect="aspect-[16/9]"
            tone={p.isMarketWatch ? "blue" : "light"}
            rounded="rounded-[16px]"
          />
        </div>
      </div>
      <div className="mt-[18px] flex flex-1 flex-col">
        <h3 className="line-clamp-3 text-[22px] leading-[28px] font-bold text-balance text-rebm-navy group-hover:underline">
          {p.title}
        </h3>
        {p.excerpt && (
          <p className="mt-[10px] line-clamp-2 text-[15px] leading-[24px] text-[rgb(70,82,94)]">{p.excerpt}</p>
        )}
        <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-auto pt-[16px] text-[14px] font-semibold text-rebm-link">
          {formatPublishedDate(p.dateIso)}
        </time>
      </div>
    </article>
  );

  if (p.href === "#") return body;
  return (
    <Link
      href={p.href}
      className="group block h-full rounded-[18px] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[3px] hover:drop-shadow-[0_12px_24px_rgba(3,44,64,0.10)] focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
    >
      {body}
    </Link>
  );
}
