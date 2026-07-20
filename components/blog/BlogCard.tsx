import Link from "next/link";

import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Regular article card for the grid. Cover (real image or placeholder), a small
 * category label, title, excerpt, then an author + date row and a Read More
 * cue pinned to the bottom so cards in a row keep equal height. Whole card links
 * to the post unless it's an inert placeholder.
 */
export function BlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);

  const cover = p.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.imageUrl} alt={p.imageAlt} loading="lazy" className="aspect-[16/9] w-full rounded-[16px] object-cover" />
  ) : (
    <ThumbPlaceholder aspect="aspect-[16/9]" tone={p.isMarketWatch ? "blue" : "light"} rounded="rounded-[16px]" />
  );

  const body = (
    <article className="flex h-full flex-col">
      {cover}
      <div className="mt-[18px] flex flex-1 flex-col">
        <span className="text-[12px] font-semibold tracking-[0.08em] text-rebm-link uppercase">{p.category}</span>
        <h3 className="mt-[8px] text-[21px] leading-[27px] font-bold text-balance text-rebm-navy group-hover:underline">
          {p.title}
        </h3>
        <p className="mt-[10px] text-[15px] leading-[24px] text-[rgb(70,82,94)]">{p.excerpt}</p>

        <div className="mt-auto pt-[18px]">
          <div className="flex items-center gap-[10px]">
            <AuthorAvatar name={p.authorName || "REBM"} src={p.authorImageUrl} size={32} />
            <div className="min-w-0 text-[13px] leading-[18px]">
              {p.authorName && <span className="block font-medium text-rebm-navy">{p.authorName}</span>}
              <time dateTime={isoDateTimeAttr(p.dateIso)} className="block text-[rgb(120,132,144)]">
                {formatPublishedDate(p.dateIso)}
              </time>
            </div>
          </div>
          <span className="mt-[12px] inline-flex items-center gap-[4px] text-[14px] font-semibold text-rebm-link group-hover:gap-[8px]">
            Read More
            <span aria-hidden="true" className="transition-all">→</span>
          </span>
        </div>
      </div>
    </article>
  );

  if (p.href === "#") return body;
  return (
    <Link href={p.href} className="group block h-full">
      {body}
    </Link>
  );
}
