import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Large featured post at the top of the blog, matching the live site: a
 * rounded brand-blue cover panel on the left and, on the right, a large navy
 * title, a muted excerpt, and the published date in brand blue. No card box,
 * shadow, or badges — the title itself is the link (inert while migrating).
 */
export function FeaturedBlogCard({ post }: { post: BlogPlaceholder }) {
  return (
    <article className="grid items-center gap-[28px] lg:grid-cols-2 lg:gap-[56px]">
      <ThumbPlaceholder aspect="aspect-[5/4]" tone="blue" rounded="rounded-[24px]" />

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
