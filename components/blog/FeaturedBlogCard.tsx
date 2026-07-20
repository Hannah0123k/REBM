import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Large featured post at the top of the blog. Like the live site's Market Pulse
 * lead, the content is centered INSIDE the rounded brand-blue cover box (title,
 * excerpt, and date), standing in for the branded cover graphic that ships
 * during migration. Full-width panel; the title itself is the link (inert
 * while migrating).
 */
export function FeaturedBlogCard({ post }: { post: BlogPlaceholder }) {
  return (
    <article className="flex min-h-[360px] w-full flex-col items-center justify-center overflow-hidden rounded-[24px] bg-rebm-blue px-[32px] py-[64px] text-center">
      <div className="max-w-[620px]">
        <h2 className="text-[32px] leading-[40px] font-bold text-balance text-rebm-navy sm:text-[46px] sm:leading-[54px]">
          {post.title}
        </h2>
        <p className="mt-[18px] text-[17px] leading-[27px] text-rebm-navy/80">{post.excerpt}</p>
        <time dateTime={post.date} className="mt-[20px] block text-[16px] font-semibold text-rebm-navy">
          {formatPostDate(post.date)}
        </time>
      </div>
    </article>
  );
}
