import Link from "next/link";

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
    // Live featured lead geometry (measured): image : text column ratio = 655 :
    // 486 with a ~72px gap; side-by-side on desktop (≥lg / >1024, where the live
    // site is horizontal) and stacked (cover on top) on tablet/mobile.
    <article className="grid items-center gap-[28px] lg:grid-cols-[655fr_486fr] lg:gap-[72px]">
      <div className="overflow-hidden rounded-[30px]">
        <div className="transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none">
          <CoverImage url={p.imageUrl} alt={p.imageAlt} aspect={BLOG_COVER_ASPECT} tone="blue" rounded="rounded-[30px]" eager />
        </div>
      </div>
      <div>
        {/* Live featured text styling (measured): title 48/57.6 w700; excerpt
            16/26.4 #334155; date 16px #6EC1E4. The live featured shows the date
            only — no author avatar. */}
        <h2 className="text-[34px] leading-[42px] font-bold text-balance text-rebm-navy transition-colors duration-200 group-hover:text-rebm-link sm:text-[48px] sm:leading-[58px]">
          {p.title}
        </h2>
        <p className="mt-[16px] text-[16px] leading-[26px] text-[rgb(51,65,85)]">{p.excerpt}</p>
        <time dateTime={isoDateTimeAttr(p.dateIso)} className="mt-[18px] block text-[16px] leading-[26px] text-[#6ec1e4]">
          {formatPublishedDate(p.dateIso)}
        </time>
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
