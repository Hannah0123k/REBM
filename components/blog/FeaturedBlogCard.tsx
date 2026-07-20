import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Large featured post at the top of the blog. Follows the Figma/live-site
 * format: a landscape cover on the left and, on the right, a left-aligned navy
 * title, a muted excerpt, and the published date in brand blue. The title is
 * the link (inert while migrating).
 */
export function FeaturedBlogCard({ post }: { post: BlogPlaceholder }) {
  return (
    <article className="grid items-center gap-[28px] lg:grid-cols-2 lg:gap-[48px]">
      {/* Landscape cover (~8:5), photo-left as in the Figma featured block. */}
      <ThumbPlaceholder aspect="aspect-[8/5]" tone="blue" rounded="rounded-[20px]" />

      <div>
        <h2 className="text-[30px] leading-[38px] font-bold text-balance text-rebm-navy sm:text-[40px] sm:leading-[48px]">
          {post.title}
        </h2>
        <p className="mt-[18px] text-[17px] leading-[27px] text-[rgb(70,82,94)]">{post.excerpt}</p>
        <time dateTime={post.date} className="mt-[20px] block text-[16px] font-medium text-rebm-link">
          {formatPostDate(post.date)}
        </time>
      </div>
    </article>
  );
}
