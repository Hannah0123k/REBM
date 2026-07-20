import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { cardFromPost } from "@/lib/blog/cardView";
import { getPublishedPosts } from "@/lib/blog/queries";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Tag archive — every published post carrying one tag, newest first. Reuses the
 * grid card. A tag with no visible posts 404s (no empty indexed pages).
 */
function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const name = titleCase(tag);
  return {
    title: `${name} — ${SITE_NAME} Blog`,
    description: `Articles tagged ${name} from ${SITE_NAME}.`,
    alternates: { canonical: absoluteUrl(`/blog/tag/${tag}`) },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const { posts, totalPages } = await getPublishedPosts({ tagSlug: tag, page, pageSize: 12 });
  if (posts.length === 0) notFound();

  return (
    <main id="main-content" className="bg-white">
      <section className="relative flex min-h-[300px] w-full items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/live/hero-bg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-rebm-blue/75" />
        <Container className="relative py-[40px] text-center">
          <p className="text-[14px] font-medium tracking-wide text-white/80 uppercase">Tag</p>
          <h1 className="mt-[6px] text-[40px] leading-[48px] font-bold tracking-[-0.5px] text-white sm:text-[52px] sm:leading-[60px]">
            {titleCase(tag)}
          </h1>
        </Container>
      </section>

      <Container className="pt-[64px] pb-[88px]">
        <div className="mx-auto max-w-[1200px]">
          <Link href="/blog" className="text-[14px] font-medium text-rebm-link hover:underline">
            ← All articles
          </Link>
          <div className="mt-[28px] grid grid-cols-1 gap-x-[40px] gap-y-[56px] sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.id} post={cardFromPost(p)} />
            ))}
          </div>
          <BlogPagination page={page} totalPages={totalPages} basePath={`/blog/tag/${tag}`} />
        </div>
      </Container>
    </main>
  );
}
