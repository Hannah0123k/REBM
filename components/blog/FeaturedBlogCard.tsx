import Link from "next/link";

import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { CoverImage } from "@/components/blog/CoverImage";
import { BLOG_COVER_ASPECT, cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Featured Market Pulse lead — the largest item on the blog. Cover uses the
 * exact production artwork ratio (1564×942 ≈ 1.66:1) so uploads don't shift the
 * layout. The ENTIRE block is one link; the CTA is a visual cue inside it (not a
 * nested anchor). Hover/focus lift the block and nudge the cover, reduced-motion
 * safe. A broken cover falls back to the placeholder (CoverImage) — never a
 * broken icon.
 */
export function FeaturedBlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);
  const live = p.href !== "#";

  const inner = (
    <article className="grid items-center gap-[28px] lg:grid-cols-[1.45fr_1fr] lg:gap-[52px]">
      <div className="overflow-hidden rounded-[22px]">
        <div className="transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none">
          <CoverImage url={p.imageUrl} alt={p.imageAlt} aspect={BLOG_COVER_ASPECT} tone="blue" rounded="rounded-[22px]" eager />
        </div>
      </div>
      <div>
        <span className="inline-flex items-center rounded-full bg-rebm-blue/15 px-[12px] py-[5px] text-[12px] font-bold tracking-[0.08em] text-rebm-navy uppercase">
          {p.category}
        </span>
        <h2 className="mt-[16px] text-[32px] leading-[40px] font-bold text-balance text-rebm-navy group-hover:underline sm:text-[42px] sm:leading-[50px]">
          {p.title}
        </h2>
        <p className="mt-[16px] text-[18px] leading-[28px] text-[rgb(70,82,94)]">{p.excerpt}</p>

        {p.authorName ? (
          <div className="mt-[20px] flex items-center gap-[10px]">
            <AuthorAvatar name={p.authorName} src={p.authorImageUrl} size={38} />
            <div className="text-[14px] leading-[19px]">
              <span className="block font-medium text-rebm-navy">{p.authorName}</span>
              <time dateTime={isoDateTimeAttr(p.dateIso)} className="block text-rebm-link">
                {formatPublishedDate(p.dateIso)}
              </time>
            </div>
          </div>
        ) : (
          <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-[18px] block text-[15px] font-semibold text-rebm-link">
            {formatPublishedDate(p.dateIso)}
          </time>
        )}

        <span
          className={`mt-[26px] inline-flex w-fit items-center gap-[8px] rounded-full px-[26px] py-[13px] text-[16px] font-medium text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out group-hover:scale-[1.03] group-hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none ${live ? "bg-rebm-navy" : "cursor-default bg-rebm-navy/60"}`}
        >
          Read the full report
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </article>
  );

  if (!live) return inner;
  return (
    <Link
      href={p.href}
      aria-label={p.title}
      className="group block rounded-[24px] focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-4 focus-visible:outline-none"
    >
      {inner}
    </Link>
  );
}
