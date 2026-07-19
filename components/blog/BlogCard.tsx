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
      <ThumbPlaceholder aspect="aspect-[16/11]" tone={tone} rounded="rounded-[18px]" />

      <h3 className="mt-[18px] text-[21px] leading-[28px] font-bold text-balance text-rebm-navy">
        {post.title}
      </h3>
      <p className="mt-[10px] text-[15px] leading-[23px] text-[rgb(70,82,94)]">{post.excerpt}</p>
      <time dateTime={post.date} className="mt-[14px] block text-[14px] font-medium text-rebm-link">
        {formatPostDate(post.date)}
      </time>
    </article>
  );
}
