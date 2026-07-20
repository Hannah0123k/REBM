import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { CoverImage } from "@/components/blog/CoverImage";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { SubscribeCard } from "@/components/blog/SubscribeCard";
import {
  getPlaceholderBody,
  getPlaceholderBySlug,
  getRelatedPlaceholders,
  type BlogPlaceholder,
  type PlaceholderBlock,
} from "@/content/blog-placeholders";
import {
  BLOG_COVER_ASPECT,
  cardFromPlaceholder,
  cardFromPost,
  type CardPost,
} from "@/lib/blog/cardView";
import { formatPublishedDate, isoDateTimeAttr } from "@/lib/blog/date";
import { getPostBySlug, getRelatedPosts, resolveOldSlug, type PublicPost } from "@/lib/blog/queries";
import { RenderBody, isBodyEmpty } from "@/lib/blog/RenderBody";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Public single-post route.
 *  - Resolves the current slug; if unknown, tries the old-slug history and
 *    issues a 308 permanent redirect to the current URL (no broken links).
 *  - Falls back to the pre-migration PLACEHOLDER catalogue so every card on the
 *    listing navigates to a real, rendering article route (no dead "#" links).
 *  - Dynamic (Supabase read via cookies) so a scheduled post appears the moment
 *    its publish time passes — no cache flush required.
 */

/** Normalized shape the article page renders — real DB post OR placeholder. */
type ArticleView = {
  title: string;
  slug: string;
  eyebrow: string;
  dateIso: string;
  readingMinutes: number;
  coverUrl: string | null;
  coverAlt: string;
  coverTone: "light" | "blue";
  authorName: string | null;
  authorImageUrl: string | null;
  tags: { name: string; slug: string }[];
  isPlaceholder: boolean;
  body: PublicPost["body"] | null;
  placeholderBlocks: PlaceholderBlock[] | null;
};

const MARKET_WATCH = new Set(["market-watch", "market-pulse"]);

function viewFromPost(post: PublicPost): ArticleView {
  const isMw = post.tags.some((t) => MARKET_WATCH.has(t.slug));
  return {
    title: post.title,
    slug: post.slug,
    eyebrow: isMw ? "Market Watch" : (post.tags[0]?.name ?? "Article"),
    dateIso: post.published_at,
    readingMinutes: post.reading_time_minutes,
    coverUrl: post.featured_image_url,
    coverAlt: post.featured_image_alt || post.title,
    coverTone: isMw ? "blue" : "light",
    authorName: post.author_name,
    authorImageUrl: post.author_image_url,
    tags: post.tags,
    isPlaceholder: false,
    body: post.body,
    placeholderBlocks: null,
  };
}

function viewFromPlaceholder(p: BlogPlaceholder): ArticleView {
  const blocks = getPlaceholderBody(p);
  const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);
  return {
    title: p.title,
    slug: p.slug,
    eyebrow: p.category,
    dateIso: p.date,
    readingMinutes: Math.max(1, Math.round(words / 200)),
    coverUrl: null, // real artwork arrives with the migration
    coverAlt: p.title,
    coverTone: p.type === "market-watch" ? "blue" : "light",
    authorName: null, // never invent an author
    authorImageUrl: null,
    tags: [],
    isPlaceholder: true,
    body: null,
    placeholderBlocks: blocks,
  };
}

async function load(slug: string): Promise<PublicPost | null> {
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

  if (!post) {
    const ph = getPlaceholderBySlug(slug);
    if (!ph) return { title: "Post not found" };
    return {
      title: ph.title,
      description: ph.excerpt,
      alternates: { canonical: absoluteUrl(`/blog/${ph.slug}`) },
      robots: { index: false }, // placeholder — keep it out of search
    };
  }

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

  let view: ArticleView;
  let related: CardPost[];

  if (post) {
    view = viewFromPost(post);
    // Related published posts (drafts excluded, current excluded). Non-fatal.
    // Fall back to placeholders so the section is never empty pre-migration.
    let realRelated: Awaited<ReturnType<typeof getRelatedPosts>> = [];
    try {
      realRelated = await getRelatedPosts(post.id, 3);
    } catch {
      realRelated = [];
    }
    related = realRelated.length
      ? realRelated.map(cardFromPost)
      : getRelatedPlaceholders("__none__", 3).map(cardFromPlaceholder);
  } else {
    const ph = getPlaceholderBySlug(slug);
    if (!ph) notFound();
    view = viewFromPlaceholder(ph);
    related = getRelatedPlaceholders(ph.id, 3).map(cardFromPlaceholder);
  }

  const articleSchema = view.isPlaceholder
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: view.title,
        datePublished: view.dateIso,
        author: view.authorName ? { "@type": "Person", name: view.authorName } : undefined,
        publisher: { "@type": "Organization", name: SITE_NAME },
        mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${view.slug}`) },
      };

  return (
    <>
      <main id="main-content" className="bg-white">
        {articleSchema && (
          <script
            type="application/ld+json"
            // JSON.stringify escapes the values; keys are static.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        )}

        <article className="pt-[calc(var(--header-h)+44px)] pb-[88px]">
          <Container>
            <div className="mx-auto max-w-[760px]">
              <Link href="/blog" className="text-[14px] font-medium text-rebm-link hover:underline">
                ← Our Blogs
              </Link>

              {/* Eyebrow → title → meta: a clear top-down hierarchy. */}
              <p className="mt-[22px] text-[13px] font-bold tracking-[0.08em] text-rebm-blue uppercase">
                {view.eyebrow}
              </p>
              <h1 className="mt-[10px] text-[34px] leading-[42px] font-bold text-balance text-rebm-navy sm:text-[48px] sm:leading-[56px]">
                {view.title}
              </h1>

              <div className="mt-[20px] flex flex-wrap items-center gap-x-[12px] gap-y-[8px] text-[15px] text-[rgb(90,102,114)]">
                {/* Author block only when real author data exists — never faked. */}
                {view.authorName && (
                  <>
                    <span className="flex items-center gap-[10px]">
                      <AuthorAvatar name={view.authorName} src={view.authorImageUrl} size={38} />
                      <span className="font-medium text-rebm-navy">{view.authorName}</span>
                    </span>
                    <span aria-hidden="true" className="text-[rgb(180,190,200)]">·</span>
                  </>
                )}
                <time dateTime={isoDateTimeAttr(view.dateIso)} className="font-medium text-rebm-link">
                  {formatPublishedDate(view.dateIso)}
                </time>
                {view.readingMinutes > 0 && (
                  <>
                    <span aria-hidden="true" className="text-[rgb(180,190,200)]">·</span>
                    <span>{view.readingMinutes} min read</span>
                  </>
                )}
              </div>

              <div className="mt-[32px]">
                <CoverImage
                  url={view.coverUrl}
                  alt={view.coverAlt}
                  aspect={BLOG_COVER_ASPECT}
                  tone={view.coverTone}
                  rounded="rounded-[20px]"
                  eager
                />
              </div>

              {view.isPlaceholder && (
                <p className="mt-[24px] rounded-[12px] bg-[#EEF3F8] px-[18px] py-[12px] text-[14px] leading-[21px] text-[rgb(70,82,94)]">
                  <span className="font-semibold text-rebm-navy">Preview.</span> This is placeholder
                  content shown while the blog is prepared for launch. The final article will appear
                  here after the content migration.
                </p>
              )}

              {/* Body — shared premium typography for real + placeholder content. */}
              <div className="prose prose-lg mt-[32px] max-w-none text-[18px] leading-[32px] text-black [&>p:first-of-type]:text-[20px] [&>p:first-of-type]:leading-[33px] [&>p:first-of-type]:text-[rgb(55,67,79)] [&_a]:text-rebm-link [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-rebm-quote-border [&_blockquote]:pl-[18px] [&_blockquote]:text-[rgb(60,72,84)] [&_blockquote]:italic [&_h2]:mt-[44px] [&_h2]:mb-[10px] [&_h2]:text-[28px] [&_h2]:leading-[34px] [&_h2]:font-bold [&_h2]:text-rebm-navy [&_h3]:mt-[34px] [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:text-rebm-navy [&_img]:my-[28px] [&_img]:rounded-[14px] [&_li]:my-[7px] [&_ol]:my-[18px] [&_ol]:list-decimal [&_ol]:pl-[26px] [&_p]:my-[20px] [&_ul]:my-[18px] [&_ul]:list-disc [&_ul]:pl-[26px]">
                {view.placeholderBlocks ? (
                  view.placeholderBlocks.map((b, i) =>
                    b.kind === "h2" ? <h2 key={i}>{b.text}</h2> : <p key={i}>{b.text}</p>,
                  )
                ) : view.body && !isBodyEmpty(view.body) ? (
                  <RenderBody doc={view.body} />
                ) : (
                  <p className="text-[rgb(90,102,114)]">This article has no content yet.</p>
                )}
              </div>

              {view.tags.length > 0 && (
                <div className="mt-[44px] flex flex-wrap gap-[10px] border-t border-rebm-card-border pt-[24px]">
                  {view.tags.map((t) => (
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

              {/* Subscription card — reusable, honest, future-ready for Resend. */}
              <div className="mt-[56px]">
                <SubscribeCard />
              </div>
            </div>
          </Container>
        </article>

        <RelatedPosts posts={related} />
      </main>
      <Footer />
    </>
  );
}
