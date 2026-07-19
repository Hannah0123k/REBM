import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Standard blog post card for the grid (Figma blog spec: image 394×270 over
 * title / excerpt / date). Styled in the current brand: white card, the shared
 * rounded-20 + restrained shadow system, navy title, dark body.
 *
 * Placeholder posts are inert (no post routes yet) — the title and "Read More"
 * are styled to preview the real card without linking to a dead URL. Swap the
 * spans for links once real posts exist.
 */
export function BlogCard({ post }: { post: BlogPlaceholder }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_16px_40px_-20px_rgba(3,44,64,0.30)]">
      <ThumbPlaceholder aspect="aspect-[394/270]" label={post.category} type={post.type} rounded="" />

      <div className="flex flex-1 flex-col p-[24px]">
        <h3 className="text-[20px] leading-[27px] font-bold text-balance text-rebm-navy">
          {post.title}
        </h3>
        <p className="mt-[10px] text-[15px] leading-[23px] text-[rgb(60,72,84)]">{post.excerpt}</p>

        <div className="mt-[20px] flex items-center justify-between gap-[12px] pt-[16px]">
          <time dateTime={post.date} className="text-[13px] text-[rgb(120,132,144)]">
            {formatPostDate(post.date)}
          </time>
          <span className="inline-flex items-center gap-[4px] text-[14px] font-semibold text-rebm-link">
            Read More
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}
