import type { MetadataRoute } from "next";

import { getAllPublishedSlugs, getPublicTags, getPublishedPosts } from "@/lib/blog/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * XML sitemap at /sitemap.xml.
 *
 * The site had none. That is survivable on a stable site, but this one moved
 * every blog post from a root-level WordPress URL to /blog/<slug>, so the map
 * Google held was wrong and there was nothing telling it the new shape.
 *
 * Built from the database rather than a hand-kept list, so a post published
 * through the admin appears here without anyone remembering to update a file.
 *
 * Revalidated hourly: new posts should turn up quickly, but this runs a handful
 * of Supabase queries and should not do so on every crawler request.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes. /admin is deliberately absent — it is gated and noindex.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // A failure here must not take the sitemap down: a partial sitemap is far
  // better than a 500, which Search Console treats as a fetch error.
  let postEntries: MetadataRoute.Sitemap = [];
  let tagEntries: MetadataRoute.Sitemap = [];

  try {
    // getPublishedPosts is paged and capped at 50 per page, so walk the pages
    // rather than assuming one call returns everything.
    const collected: { slug: string; published_at: string | null }[] = [];
    for (let page = 1; page <= 50; page++) {
      const res = await getPublishedPosts({ page, pageSize: 50 });
      collected.push(...res.posts.map((p) => ({ slug: p.slug, published_at: p.published_at })));
      if (page >= res.totalPages || res.posts.length === 0) break;
    }
    postEntries = collected.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    // Belt and braces: if that query ever changes shape, fall back to the
    // slug-only query so posts cannot silently vanish from the sitemap.
    if (postEntries.length === 0) {
      const slugs = await getAllPublishedSlugs();
      postEntries = slugs.map((slug) => ({
        url: absoluteUrl(`/blog/${slug}`),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error(`[sitemap] post query failed: ${e instanceof Error ? e.message : "unknown"}`);
  }

  try {
    const tags = await getPublicTags();
    tagEntries = tags.map((t) => ({
      url: absoluteUrl(`/blog/tag/${t.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));
  } catch (e) {
    console.error(`[sitemap] tag query failed: ${e instanceof Error ? e.message : "unknown"}`);
  }

  return [...staticEntries, ...postEntries, ...tagEntries];
}
