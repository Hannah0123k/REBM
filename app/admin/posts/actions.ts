"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { readingTimeMinutes } from "@/lib/blog/readingTime";
import { sanitizeDoc } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import type { PostStatus } from "@/lib/blog/types";
import { postInputSchema } from "@/lib/blog/validation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id: string; slug: string; updatedAt: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; conflict?: boolean };

/** Normalize status vs date: future 'published' → scheduled; due 'scheduled' → published. */
function normalizeStatus(status: PostStatus, publishedAt: string | null): PostStatus {
  if (!publishedAt) return status;
  const future = new Date(publishedAt) > new Date();
  if (status === "published" && future) return "scheduled";
  if (status === "scheduled" && !future) return "published";
  return status;
}

/** Turn a zod error into a flat field→message map. */
function fieldErrorsFrom(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.length ? String(i.path[0]) : "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

/** Build the DB row from validated input. */
function toRow(input: ReturnType<typeof postInputSchema.parse>) {
  const body = sanitizeDoc(input.body);
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    body,
    featured_image_url: input.featured_image_url ?? null,
    featured_image_alt: input.featured_image_alt ?? null,
    author_name: input.author_name ?? null,
    status: normalizeStatus(input.status, input.published_at ?? null),
    featured: input.featured,
    reading_time_minutes: readingTimeMinutes(body),
    published_at: input.published_at ?? null,
    seo_title: input.seo_title ?? null,
    meta_description: input.meta_description ?? null,
  };
}

function revalidateBlog(slug: string, previousSlug?: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
}

// ── create ─────────────────────────────────────────────────────────────────
export async function createPost(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const dupe = await slugTaken(parsed.data.slug);
  if (dupe) return { ok: false, error: "Slug in use.", fieldErrors: { slug: "That slug is already taken." } };

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(toRow(parsed.data))
    .select("id, slug, updated_at")
    .single();

  if (error) return dbError(error);
  await syncTags(supabase, data.id, parsed.data.tags);
  revalidateBlog(data.slug);
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

// ── update ─────────────────────────────────────────────────────────────────
export async function updatePost(
  id: string,
  raw: unknown,
  expectedUpdatedAt?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("id", id)
    .single();
  if (!existing) return { ok: false, error: "Post not found." };

  // Optimistic concurrency: refuse to overwrite a version the editor didn't see.
  if (expectedUpdatedAt && existing.updated_at !== expectedUpdatedAt) {
    return {
      ok: false,
      conflict: true,
      error: "This post was changed elsewhere since you opened it. Reload to see the latest version before saving.",
    };
  }

  if (await slugTaken(parsed.data.slug, id)) {
    return { ok: false, error: "Slug in use.", fieldErrors: { slug: "That slug is already taken." } };
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(toRow(parsed.data))
    .eq("id", id)
    .select("id, slug, updated_at")
    .single();
  if (error) return dbError(error);

  // Preserve the old URL for redirects when the slug changes.
  if (existing.slug !== data.slug) {
    await supabase
      .from("blog_post_slugs")
      .upsert({ old_slug: existing.slug, post_id: id }, { onConflict: "old_slug" });
    // If this slug was itself an old slug for this post, retire that redirect.
    await supabase.from("blog_post_slugs").delete().eq("old_slug", data.slug).eq("post_id", id);
  }

  await syncTags(supabase, id, parsed.data.tags);
  revalidateBlog(data.slug, existing.slug);
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

// ── autosave ────────────────────────────────────────────────────────────────
/**
 * Background autosave of the content fields only — NEVER the slug, status,
 * published_at, tags, or SEO. This keeps a live post's URL and publication
 * state exactly as last intentionally saved; those change only through an
 * explicit Save. Guarded by optimistic concurrency so a stale editor tab can't
 * clobber a newer version (returns { conflict } instead).
 */
export async function autosavePost(
  id: string,
  fields: { title: string; body: unknown; excerpt?: string },
  expectedUpdatedAt?: string,
): Promise<{ ok: boolean; savedAt?: string; error?: string; conflict?: boolean }> {
  await requireAdmin();
  const supabase = await createClient();

  if (expectedUpdatedAt) {
    const { data: cur } = await supabase.from("blog_posts").select("updated_at").eq("id", id).single();
    if (cur && cur.updated_at !== expectedUpdatedAt) {
      return { ok: false, conflict: true, error: "Post changed on the server." };
    }
  }

  const body = sanitizeDoc(fields.body);
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      title: fields.title || "Untitled",
      body,
      excerpt: fields.excerpt || null,
      reading_time_minutes: readingTimeMinutes(body),
    })
    .eq("id", id)
    .select("updated_at")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, savedAt: data.updated_at };
}

// ── duplicate ──────────────────────────────────────────────────────────────
export async function duplicatePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: src, error: e1 } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (e1 || !src) return { ok: false, error: "Post not found." };

  const baseSlug = `${slugify(src.title)}-copy`;
  const slug = await uniqueSlug(baseSlug);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: `Copy of ${src.title}`,
      slug,
      excerpt: src.excerpt,
      body: src.body,
      featured_image_url: src.featured_image_url,
      featured_image_alt: src.featured_image_alt,
      author_name: src.author_name,
      status: "draft",
      featured: false,
      reading_time_minutes: src.reading_time_minutes,
      published_at: null,
      seo_title: src.seo_title,
      meta_description: src.meta_description,
    })
    .select("id, slug, updated_at")
    .single();
  if (error) return dbError(error);
  // Carry the source post's tags onto the copy.
  const tagNames = await getPostTagNames(id);
  await syncTags(supabase, data.id, tagNames);
  revalidatePath("/admin/posts");
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

// ── archive / restore / delete ──────────────────────────────────────────────
export async function archivePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, slug, updated_at")
    .single();
  if (error) return dbError(error);
  revalidateBlog(data.slug);
  revalidatePath("/admin/posts");
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

export async function restorePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .update({ archived_at: null })
    .eq("id", id)
    .select("id, slug, updated_at")
    .single();
  if (error) return dbError(error);
  revalidateBlog(data.slug);
  revalidatePath("/admin/posts");
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

/** Permanent delete — the UI gates this behind a typed confirmation. */
export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .select("id, slug, updated_at")
    .single();
  if (error) return dbError(error);
  revalidateBlog(data.slug);
  revalidatePath("/admin/posts");
  return { ok: true, id: data.id, slug: data.slug, updatedAt: data.updated_at };
}

// ── helpers ─────────────────────────────────────────────────────────────────

/**
 * Replace a post's tags from a list of NAMES: ensure each tag exists (creating
 * it with a derived slug), then rewrite the join rows. Names that collide on
 * slug are deduped. Runs as a full replace so removing a tag in the editor
 * removes the link.
 */
async function syncTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  names: string[],
): Promise<void> {
  const bySlug = new Map<string, string>();
  for (const raw of names ?? []) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }

  const slugs = [...bySlug.keys()];
  if (slugs.length) {
    await supabase
      .from("tags")
      .upsert(
        slugs.map((slug) => ({ slug, name: bySlug.get(slug)! })),
        { onConflict: "slug", ignoreDuplicates: true },
      );
  }

  let tagIds: string[] = [];
  if (slugs.length) {
    const { data } = await supabase.from("tags").select("id").in("slug", slugs);
    tagIds = (data ?? []).map((t) => t.id as string);
  }

  await supabase.from("blog_post_tags").delete().eq("post_id", postId);
  if (tagIds.length) {
    await supabase
      .from("blog_post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
  }
}

/** Read a post's tag names (for hydrating the editor). */
export async function getPostTagNames(postId: string): Promise<string[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_post_tags")
    .select("tags(name)")
    .eq("post_id", postId);
  const names = (data ?? [])
    .flatMap((row) => {
      const t = (row as { tags?: { name?: string } | { name?: string }[] }).tags;
      return Array.isArray(t) ? t : t ? [t] : [];
    })
    .map((t) => t?.name)
    .filter((n): n is string => Boolean(n));
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("blog_posts").select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (await slugTaken(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function dbError(error: { code?: string; message: string }): ActionResult {
  if (error.code === "23505") {
    return { ok: false, error: "Slug in use.", fieldErrors: { slug: "That slug is already taken." } };
  }
  return { ok: false, error: error.message };
}
