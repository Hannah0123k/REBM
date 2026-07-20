import "server-only";

import type { TiptapDoc } from "@/lib/blog/types";
import { createClient } from "@/lib/supabase/server";

/**
 * PUBLIC blog data access — the single source of truth for what visitors see.
 * =========================================================================
 * VISIBILITY: a post is public iff it is publish-intended (status 'published'
 * OR 'scheduled'), its instant has arrived (`published_at <= now()`), and it is
 * not archived. This predicate is enforced twice — by RLS (migration 0002) and
 * again explicitly in every query here — so the rule holds even if a caller
 * ever swaps in a service-role client that bypasses RLS.
 *
 * ORDERING: every listing sorts `published_at DESC, id DESC`. `published_at` is
 * the admin-chosen instant (which may be back-dated for migrated posts), never
 * `created_at`/`updated_at`/insertion order — so imported posts land in their
 * true chronological position. The `id DESC` tiebreak keeps ordering stable and
 * pagination deterministic when two posts share a timestamp.
 *
 * TIME ZONES: `published_at` is `timestamptz` (a UTC instant). We compare
 * against `new Date().toISOString()` (UTC). The admin UI always submits an
 * offset-aware instant, so a "9:30 AM" choice is pinned to one exact moment and
 * cannot drift with DST or server locale. See docs/BLOG_CMS.md.
 */

export type PublicTag = { name: string; slug: string };

export type PublicPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_name: string | null;
  author_image_url: string | null;
  published_at: string;
  reading_time_minutes: number;
  featured: boolean;
  tags: PublicTag[];
};

export type PublicPost = PublicPostCard & {
  body: TiptapDoc;
  seo_title: string | null;
  meta_description: string | null;
};

const CARD_COLUMNS =
  "id, title, slug, excerpt, featured_image_url, featured_image_alt, author_name, author_image_url, published_at, reading_time_minutes, featured, blog_post_tags(tags(name, slug))";
const FULL_COLUMNS = `${CARD_COLUMNS}, body, seo_title, meta_description`;

const DEFAULT_PAGE_SIZE = 12;

type RawTag = { name?: string; slug?: string };
// PostgREST/Supabase types the embedded to-one `tags` as an array in some
// inference paths, though at runtime it's a single object — accept both.
type RawTagJoin = { tags?: RawTag | RawTag[] | null } | null;
type RawRow = Record<string, unknown> & { blog_post_tags?: RawTagJoin[] | null };

/** Flatten the nested `blog_post_tags(tags(...))` join into a clean tag list. */
function mapTags(row: RawRow): PublicTag[] {
  const out: PublicTag[] = [];
  for (const join of row.blog_post_tags ?? []) {
    const t = join?.tags;
    if (!t) continue;
    for (const tag of Array.isArray(t) ? t : [t]) {
      if (tag?.name && tag?.slug) out.push({ name: tag.name, slug: tag.slug });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function toCard(row: RawRow): PublicPostCard {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: (row.excerpt as string | null) ?? null,
    featured_image_url: (row.featured_image_url as string | null) ?? null,
    featured_image_alt: (row.featured_image_alt as string | null) ?? null,
    author_name: (row.author_name as string | null) ?? null,
    author_image_url: (row.author_image_url as string | null) ?? null,
    published_at: row.published_at as string,
    reading_time_minutes: (row.reading_time_minutes as number) ?? 0,
    featured: Boolean(row.featured),
    tags: mapTags(row),
  };
}

function toPost(row: RawRow): PublicPost {
  return {
    ...toCard(row),
    body: (row.body as TiptapDoc) ?? { type: "doc", content: [] },
    seo_title: (row.seo_title as string | null) ?? null,
    meta_description: (row.meta_description as string | null) ?? null,
  };
}

/** Apply the public-visibility predicate to any blog_posts query builder. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onlyVisible<T extends { in: any; not: any; lte: any; is: any }>(q: T): T {
  const nowIso = new Date().toISOString();
  return q
    .in("status", ["published", "scheduled"])
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .is("archived_at", null);
}

export type PostPage = {
  posts: PublicPostCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * A page of published posts, newest first. `tagSlug` filters to one tag;
 * `search` matches title/excerpt (a simple ILIKE — swap for Postgres FTS when
 * volume warrants). Pagination is 1-based.
 */
export async function getPublishedPosts(opts?: {
  page?: number;
  pageSize?: number;
  tagSlug?: string;
  search?: string;
  /** Omit a specific post (e.g. the featured one shown separately on page 1). */
  excludeId?: string;
}): Promise<PostPage> {
  const page = Math.max(1, Math.floor(opts?.page ?? 1));
  const pageSize = Math.max(1, Math.min(50, Math.floor(opts?.pageSize ?? DEFAULT_PAGE_SIZE)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Tag filter needs an inner join so the WHERE can reference the joined slug.
  const columns = opts?.tagSlug
    ? CARD_COLUMNS.replace("blog_post_tags(", "blog_post_tags!inner(").replace(
        "tags(name, slug)",
        "tags!inner(name, slug)",
      )
    : CARD_COLUMNS;

  let query = onlyVisible(supabase.from("blog_posts").select(columns, { count: "exact" }));

  if (opts?.excludeId) query = query.neq("id", opts.excludeId);
  if (opts?.tagSlug) query = query.eq("blog_post_tags.tags.slug", opts.tagSlug);
  if (opts?.search?.trim()) {
    const q = opts.search.trim().replace(/[%_,]/g, " ");
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data, count, error } = await query
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`getPublishedPosts: ${error.message}`);

  const total = count ?? 0;
  return {
    posts: (data ?? []).map((r) => toCard(r as unknown as RawRow)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * The featured post for the top of the index: the newest post flagged
 * `featured`, falling back to the single newest published post. Returns null
 * when nothing is published yet (caller shows placeholders).
 */
export async function getFeaturedPost(): Promise<PublicPostCard | null> {
  const supabase = await createClient();

  const featured = await onlyVisible(supabase.from("blog_posts").select(CARD_COLUMNS))
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (featured.error) throw new Error(`getFeaturedPost: ${featured.error.message}`);
  if (featured.data) return toCard(featured.data as unknown as RawRow);

  const newest = await onlyVisible(supabase.from("blog_posts").select(CARD_COLUMNS))
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (newest.error) throw new Error(`getFeaturedPost: ${newest.error.message}`);
  return newest.data ? toCard(newest.data as unknown as RawRow) : null;
}

/** A single visible post by its current slug, or null if not publicly visible. */
export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  const supabase = await createClient();
  const { data, error } = await onlyVisible(supabase.from("blog_posts").select(FULL_COLUMNS))
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPostBySlug: ${error.message}`);
  return data ? toPost(data as unknown as RawRow) : null;
}

/**
 * Resolve an OLD slug to the post's CURRENT slug for a 301 redirect. Only
 * returns a target when the post is still publicly visible. Returns null when
 * the old slug is unknown or the post is no longer public.
 */
export async function resolveOldSlug(oldSlug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: hist, error } = await supabase
    .from("blog_post_slugs")
    .select("post_id")
    .eq("old_slug", oldSlug)
    .maybeSingle();
  if (error || !hist) return null;

  const { data: post } = await onlyVisible(supabase.from("blog_posts").select("slug"))
    .eq("id", hist.post_id)
    .maybeSingle();
  return (post?.slug as string | undefined) ?? null;
}

/**
 * Related published posts for the "You May Also Like" section — newest first,
 * EXCLUDING the current post and (via onlyVisible + RLS) any draft/unpublished.
 */
export async function getRelatedPosts(excludeId: string, limit = 3): Promise<PublicPostCard[]> {
  const supabase = await createClient();
  const { data, error } = await onlyVisible(supabase.from("blog_posts").select(CARD_COLUMNS))
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRelatedPosts: ${error.message}`);
  return (data ?? []).map((r) => toCard(r as unknown as RawRow));
}

/** All slugs of currently-visible posts — for generateStaticParams / sitemaps. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await onlyVisible(supabase.from("blog_posts").select("slug"))
    .order("published_at", { ascending: false });
  if (error) throw new Error(`getAllPublishedSlugs: ${error.message}`);
  return (data ?? []).map((r) => (r as { slug: string }).slug);
}

/** Tags that have at least one publicly-visible post (public read via RLS). */
export async function getPublicTags(): Promise<PublicTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_post_tags")
    .select("tags(name, slug)");
  if (error) throw new Error(`getPublicTags: ${error.message}`);
  const seen = new Map<string, PublicTag>();
  for (const row of (data ?? []) as unknown as RawTagJoin[]) {
    const t = row?.tags;
    for (const tag of Array.isArray(t) ? t : t ? [t] : []) {
      if (tag?.name && tag?.slug && !seen.has(tag.slug)) {
        seen.set(tag.slug, { name: tag.name, slug: tag.slug });
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
