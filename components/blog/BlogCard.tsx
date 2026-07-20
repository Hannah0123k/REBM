import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Standard blog post card for the grid, matching the live site's clean style:
 * a rounded image/cover on top, then a navy title, a muted excerpt, and the
 * date in brand blue — no heavy card box, on the white page. Inert while
 * migrating (title becomes the link once real posts exist).
 */
export function BlogCard({ post }: { post: BlogPlaceholder }) {
  const tone = post.type === "market-watch" ? "blue" : "light";
  return (
    <article className="flex flex-col">
      {/* Shorter landscape thumbnail (~16:9), left-aligned text below — matches
          the live grid. */}
      <ThumbPlaceholder aspect="aspect-[16/9]" tone={tone} rounded="rounded-[16px]" />

      <h3 className="mt-[20px] text-[25px] leading-[31px] font-bold text-balance text-rebm-navy">
        {post.title}
      </h3>
      <p className="mt-[12px] text-[16px] leading-[25px] text-[rgb(70,82,94)]">{post.excerpt}</p>
      <time dateTime={post.date} className="mt-[18px] block text-[15px] font-medium text-rebm-link">
        {formatPostDate(post.date)}
      </time>
    </article>
  );
}
