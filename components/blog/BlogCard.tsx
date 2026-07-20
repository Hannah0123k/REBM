import Link from "next/link";

import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Standard blog post card for the grid, matching the live site's clean style:
 * a rounded cover on top, then a navy title, a muted excerpt, and the date in
 * brand blue. Renders the real featured image when present, else the tinted
 * placeholder cover. Links to the post unless it's an inert placeholder.
 * Accepts either a normalized CardPost or a legacy placeholder.
 */
export function BlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);
  const tone = p.isMarketWatch ? "blue" : "light";

  const cover = p.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.imageUrl}
      alt={p.imageAlt}
      loading="lazy"
      className="aspect-[16/9] w-full rounded-[16px] object-cover"
    />
  ) : (
    <ThumbPlaceholder aspect="aspect-[16/9]" tone={tone} rounded="rounded-[16px]" />
  );

  const body = (
    <article className="flex flex-col">
      {cover}
      <h3 className="mt-[20px] text-[25px] leading-[31px] font-bold text-balance text-rebm-navy group-hover:underline">
        {p.title}
      </h3>
      <p className="mt-[12px] text-[16px] leading-[25px] text-[rgb(70,82,94)]">{p.excerpt}</p>
      <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-[18px] block text-[15px] font-medium text-rebm-link">
        {formatPublishedDate(p.dateIso)}
      </time>
    </article>
  );

  if (p.href === "#") return body;
  return (
    <Link href={p.href} className="group block">
      {body}
    </Link>
  );
}
