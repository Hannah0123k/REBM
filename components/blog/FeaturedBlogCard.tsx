import { ThumbPlaceholder } from "@/components/blog/PlaceholderMedia";
import { formatPostDate, type BlogPlaceholder } from "@/content/blog-placeholders";

/**
 * Large featured post at the top of the blog (Figma featured card ≈ 668×473).
 * On the live site this slot holds the latest Market Watch / "Market Pulse"
 * item, so it gets the most prominent treatment: image beside larger title +
 * excerpt on desktop, stacked on mobile. Current brand styling throughout.
 *
 * Inert while posts don't exist yet (see BlogCard).
 */
export function FeaturedBlogCard({ post }: { post: BlogPlaceholder }) {
  return (
    <article className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_48px_-24px_rgba(3,44,64,0.32)] lg:grid lg:grid-cols-[1.15fr_1fr]">
      <ThumbPlaceholder
        aspect="aspect-[668/473] lg:aspect-auto lg:h-full lg:min-h-[340px]"
        label={post.category}
        type={post.type}
        rounded=""
      />

      <div className="flex flex-col justify-center p-[28px] sm:p-[40px]">
        <span className="text-[13px] font-semibold tracking-[0.08em] text-rebm-link uppercase">
          Featured
        </span>
        <h2 className="mt-[10px] text-[26px] leading-[33px] font-bold text-balance text-rebm-navy sm:text-[30px] sm:leading-[38px]">
          {post.title}
        </h2>
        <p className="mt-[14px] text-[16px] leading-[25px] text-[rgb(55,67,79)]">{post.excerpt}</p>

        <div className="mt-[22px] flex items-center gap-[16px]">
          <time dateTime={post.date} className="text-[14px] text-[rgb(120,132,144)]">
            {formatPostDate(post.date)}
          </time>
          <span className="inline-flex items-center gap-[5px] text-[15px] font-semibold text-rebm-link">
            Read More
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}
