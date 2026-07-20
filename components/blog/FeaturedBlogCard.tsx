import Link from "next/link";

import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Featured Market Watch lead — the largest, most prominent item on the blog and
 * the alignment anchor for the grid beneath it (shares the page's outer
 * container). A large cover on the left; on the right a MARKET WATCH label,
 * large title, excerpt, author + date, and a CTA. Deliberately NOT an
 * equal-size grid card. Renders the real image when present, else a placeholder.
 */
export function FeaturedBlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);
  const live = p.href !== "#";

  const cover = p.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.imageUrl} alt={p.imageAlt} className="aspect-[16/10] w-full rounded-[22px] object-cover" />
  ) : (
    <ThumbPlaceholder aspect="aspect-[16/10]" tone="blue" rounded="rounded-[22px]" />
  );

  const cta =
    "mt-[26px] inline-flex w-fit items-center gap-[8px] rounded-full bg-rebm-navy px-[26px] py-[13px] text-[16px] font-medium text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none";

  return (
    <article className="grid items-center gap-[28px] lg:grid-cols-[1.15fr_1fr] lg:gap-[48px]">
      {live ? (
        <Link href={p.href} className="block" aria-label={p.title}>
          {cover}
        </Link>
      ) : (
        cover
      )}

      <div>
        <span className="inline-flex items-center rounded-full bg-rebm-blue/15 px-[12px] py-[5px] text-[12px] font-bold tracking-[0.08em] text-rebm-navy uppercase">
          {p.category}
        </span>

        <h2 className="mt-[14px] text-[30px] leading-[38px] font-bold text-balance text-rebm-navy sm:text-[42px] sm:leading-[50px]">
          {live ? (
            <Link href={p.href} className="hover:underline">
              {p.title}
            </Link>
          ) : (
            p.title
          )}
        </h2>

        <p className="mt-[16px] text-[18px] leading-[28px] text-[rgb(70,82,94)]">{p.excerpt}</p>

        <div className="mt-[20px] flex items-center gap-[10px]">
          <AuthorAvatar name={p.authorName || "REBM"} src={p.authorImageUrl} size={38} />
          <div className="text-[14px] leading-[19px]">
            {p.authorName && <span className="block font-medium text-rebm-navy">{p.authorName}</span>}
            <time dateTime={isoDateTimeAttr(p.dateIso)} className="block text-[rgb(120,132,144)]">
              {formatPublishedDate(p.dateIso)}
            </time>
          </div>
        </div>

        {live ? (
          <Link href={p.href} className={cta}>
            Read the full report
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span
            className={`${cta} cursor-default opacity-60 hover:scale-100 hover:shadow-sm`}
            aria-disabled="true"
            title="Available after migration"
          >
            Read the full report
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </article>
  );
}
