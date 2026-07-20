import Link from "next/link";

import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { cardFromPlaceholder, type CardPost } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import type { BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Large featured post at the top of the blog. Follows the Figma/live-site
 * format: a landscape cover on the left and, on the right, a left-aligned navy
 * title, a muted excerpt, and the published date in brand blue. Renders the
 * real featured image when present, else the tinted placeholder cover. Links to
 * the post unless it's an inert placeholder. Accepts a CardPost or placeholder.
 */
export function FeaturedBlogCard({ post }: { post: CardPost | BlogPlaceholder }) {
  const p = "href" in post && "dateIso" in post ? post : cardFromPlaceholder(post as BlogPlaceholder);

  const cover = p.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.imageUrl}
      alt={p.imageAlt}
      className="aspect-[8/5] w-full rounded-[20px] object-cover"
    />
  ) : (
    <ThumbPlaceholder aspect="aspect-[8/5]" tone="blue" rounded="rounded-[20px]" />
  );

  const body = (
    <article className="grid items-center gap-[28px] lg:grid-cols-2 lg:gap-[48px]">
      {cover}
      <div>
        <h2 className="text-[30px] leading-[38px] font-bold text-balance text-rebm-navy group-hover:underline sm:text-[40px] sm:leading-[48px]">
          {p.title}
        </h2>
        <p className="mt-[18px] text-[17px] leading-[27px] text-[rgb(70,82,94)]">{p.excerpt}</p>
        <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-[20px] block text-[16px] font-medium text-rebm-link">
          {formatPublishedDate(p.dateIso)}
        </time>
      </div>
    </article>
  );

  if (p.href === "#") return body;
  return (
    <Link href={p.href} className="group block">
      {body}
    </Link>
  );
}
