import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { CoverImage } from "@/components/blog/CoverImage";
import { NewsletterSection } from "@/components/blog/NewsletterSection";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BLOG_COVER_ASPECT } from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import { getPostBySlug, getRelatedPosts, resolveOldSlug } from "@/lib/blog/queries";
import { RenderBody, isBodyEmpty } from "@/lib/blog/RenderBody";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Public single-post route.
 *  - Resolves the current slug; if unknown, tries the old-slug history and
 *    issues a 308 permanent redirect to the current URL (no broken links).
 *  - Dynamic (Supabase read via cookies) so a scheduled post appears the moment
 *    its publish time passes — no cache flush required.
 */

async function load(slug: string) {
  const post = await getPostBySlug(slug);
  if (post) return post;
  const current = await resolveOldSlug(slug);
  if (current && current !== slug) permanentRedirect(`/blog/${current}`);
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const title = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt || undefined;
  const url = absoluteUrl(`/blog/${post.slug}`);
  const images = post.featured_image_url
    ? [{ url: post.featured_image_url, alt: post.featured_image_alt || post.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: post.published_at,
      authors: post.author_name ? [post.author_name] : undefined,
      images,
    },
    twitter: {
      card: post.featured_image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) notFound();

  // Related published posts (drafts excluded, current excluded). Non-fatal.
  let related: Awaited<ReturnType<typeof getRelatedPosts>> = [];
  try {
    related = await getRelatedPosts(post.id, 3);
  } catch {
    related = [];
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.featured_image_url || undefined,
    datePublished: post.published_at,
    author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) },
  };

  return (
    <>
    <main id="main-content" className="bg-white">
      <script
        type="application/ld+json"
        // JSON.stringify escapes the values; keys are static.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="pt-[calc(var(--header-h)+40px)] pb-[80px]">
        <Container>
          <div className="mx-auto max-w-[760px]">
            <Link href="/blog" className="text-[14px] font-medium text-rebm-link hover:underline">
              ← Our Blogs
            </Link>

            <h1 className="mt-[18px] text-[34px] leading-[42px] font-bold text-balance text-rebm-navy sm:text-[46px] sm:leading-[54px]">
              {post.title}
            </h1>

            <div className="mt-[18px] flex flex-wrap items-center gap-x-[12px] gap-y-[8px] text-[15px] text-[rgb(90,102,114)]">
              {/* Author block only when real author data exists — never faked. */}
              {post.author_name && (
                <>
                  <span className="flex items-center gap-[10px]">
                    <AuthorAvatar name={post.author_name} src={post.author_image_url} size={38} />
                    <span className="font-medium text-rebm-navy">{post.author_name}</span>
                  </span>
                  <span aria-hidden="true" className="text-[rgb(180,190,200)]">·</span>
                </>
              )}
              <time dateTime={isoDateTimeAttr(post.published_at)} className="text-rebm-link">
                {formatPublishedDate(post.published_at)}
              </time>
              {post.reading_time_minutes > 0 && (
                <>
                  <span aria-hidden="true" className="text-[rgb(180,190,200)]">·</span>
                  <span>{post.reading_time_minutes} min read</span>
                </>
              )}
            </div>

            <div className="mt-[28px]">
              <CoverImage
                url={post.featured_image_url}
                alt={post.featured_image_alt || post.title}
                aspect={BLOG_COVER_ASPECT}
                tone="light"
                rounded="rounded-[20px]"
                eager
              />
            </div>

            {isBodyEmpty(post.body) ? (
              <p className="mt-[32px] text-[18px] text-[rgb(90,102,114)]">
                This article has no content yet.
              </p>
            ) : (
              <div className="prose prose-lg mt-[32px] max-w-none text-[18px] leading-[30px] text-black [&_a]:text-rebm-link [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-rebm-card-border [&_blockquote]:pl-[16px] [&_blockquote]:italic [&_h2]:mt-[36px] [&_h2]:text-[28px] [&_h2]:font-bold [&_h2]:text-rebm-navy [&_h3]:mt-[28px] [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:text-rebm-navy [&_img]:my-[24px] [&_img]:rounded-[12px] [&_li]:my-[6px] [&_ol]:my-[16px] [&_ol]:list-decimal [&_ol]:pl-[26px] [&_p]:my-[16px] [&_ul]:my-[16px] [&_ul]:list-disc [&_ul]:pl-[26px]">
                <RenderBody doc={post.body} />
              </div>
            )}

            {post.tags.length > 0 && (
              <div className="mt-[40px] flex flex-wrap gap-[10px] border-t border-rebm-card-border pt-[24px]">
                {post.tags.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/blog/tag/${t.slug}`}
                    className="rounded-full bg-[#EEF3F8] px-[14px] py-[6px] text-[14px] font-medium text-rebm-navy hover:bg-[#E1EAF3]"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Container>
      </article>
      <RelatedPosts posts={related} />
      <NewsletterSection />
    </main>
      <Footer />
    </>
  );
}
