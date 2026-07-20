/**
 * WRITE-PHASE importer. Reads the REVIEWED dry-run artifacts in ./migration/
 * (manifest.json + posts/<slug>.tiptap.json) and writes them into Supabase.
 *
 * SAFETY
 *  - IMPORT_AS_DRAFT=true (default): every post is written status='draft' with
 *    review_required=true — nothing becomes public. Set IMPORT_AS_DRAFT=false to
 *    import with the original published state (still gated by the CMS).
 *  - --mode=create-only (default): never touches an already-imported post.
 *    --mode=update-unmodified: updates only imports NOT manually edited since.
 *    --mode=force-update: always overwrites the imported row.
 *  - Idempotent: matched by (source_site, source_post_id); safe to re-run.
 *  - Uses SUPABASE_SERVICE_ROLE_KEY (server-only, from .env.local). Never logged.
 *  - published_at = the ORIGINAL source instant (never the migration date).
 *
 * Run: node scripts/migrate/import.mts            # draft, create-only
 *      IMPORT_AS_DRAFT=false node scripts/migrate/import.mts
 *      node scripts/migrate/import.mts --mode=update-unmodified
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { readingTimeMinutes } from "../../lib/blog/readingTime.ts";
import { slugify } from "../../lib/blog/slug.ts";
import { SOURCE_SITE } from "./lib.mts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "migration");
const MODE = (process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "create-only") as
  | "create-only" | "update-unmodified" | "force-update";
const AS_DRAFT = process.env.IMPORT_AS_DRAFT !== "false"; // default true
const BATCH_ID = `import-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
const db = createClient(url, key, { auth: { persistSession: false } });

type Manifest = Record<string, any>;
const manifest: Manifest[] = JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8"));
const bodyFiles = new Set(readdirSync(join(OUT, "posts")));

console.log(`Importing ${manifest.length} posts · mode=${MODE} · status=${AS_DRAFT ? "draft" : "original"} · batch=${BATCH_ID}\n`);

/** Ensure tag rows exist and return their ids (dedupe by slug). */
async function ensureTags(names: string[]): Promise<string[]> {
  const bySlug = new Map<string, string>();
  for (const n of names) { const s = slugify(n); if (s && !bySlug.has(s)) bySlug.set(s, n.trim()); }
  const slugs = [...bySlug.keys()];
  if (!slugs.length) return [];
  await db.from("tags").upsert(slugs.map((s) => ({ slug: s, name: bySlug.get(s)! })), { onConflict: "slug", ignoreDuplicates: true });
  const { data } = await db.from("tags").select("id").in("slug", slugs);
  return (data ?? []).map((t) => t.id as string);
}

/** Pick a slug that doesn't collide with an existing DB post. */
async function freeSlug(base: string, ownPostId?: string): Promise<{ slug: string; conflicted: boolean }> {
  let slug = base, n = 2, conflicted = false;
  for (;;) {
    const { data } = await db.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === ownPostId) return { slug, conflicted };
    conflicted = true; slug = `${base}-${n++}`;
  }
}

const results: any[] = [];
let created = 0, updated = 0, skipped = 0, failed = 0;

for (const m of manifest) {
  const label = m.page_title;
  try {
    const bodyFile = `${m.proposed_slug}.tiptap.json`;
    if (!bodyFiles.has(bodyFile)) throw new Error(`missing converted body ${bodyFile}`);
    const body = JSON.parse(readFileSync(join(OUT, "posts", bodyFile), "utf8"));
    const publishedAt = m.detected_publish_time
      ? `${m.detected_publish_date}T${m.detected_publish_time}Z`
      : `${m.detected_publish_date}T12:00:00Z`;

    // idempotency lookup
    const { data: existing } = await db.from("blog_post_imports")
      .select("id, post_id, last_imported_at").eq("source_site", SOURCE_SITE).eq("source_post_id", String(m.source_id)).maybeSingle();

    if (existing && MODE === "create-only") { skipped++; results.push({ title: label, action: "skipped (exists)" }); console.log(`  skip   ${label}`); continue; }
    if (existing && MODE === "update-unmodified") {
      const { data: post } = await db.from("blog_posts").select("updated_at").eq("id", existing.post_id).maybeSingle();
      if (post && existing.last_imported_at && new Date(post.updated_at) > new Date(existing.last_imported_at)) {
        skipped++; results.push({ title: label, action: "skipped (manually edited)" }); console.log(`  skip*  ${label} (manually edited)`); continue;
      }
    }

    const row = {
      title: m.page_title,
      slug: (await freeSlug(m.proposed_slug, existing?.post_id)).slug,
      excerpt: m.excerpt ?? null,
      body,
      featured_image_url: null,          // images replaced later; placeholder shows in UI
      featured_image_alt: null,
      author_name: m.detected_author ?? null,
      author_image_url: null,
      status: AS_DRAFT ? "draft" : (new Date(publishedAt) <= new Date() ? "published" : "scheduled"),
      featured: false,                   // newest post leads via getFeaturedPost fallback
      reading_time_minutes: readingTimeMinutes(body),
      published_at: publishedAt,
      seo_title: null,                   // no source SEO — flagged for review
      meta_description: null,
    };

    let postId = existing?.post_id as string | undefined;
    if (existing) {
      const { error } = await db.from("blog_posts").update(row).eq("id", postId!);
      if (error) throw new Error(error.message);
      updated++;
    } else {
      const { data, error } = await db.from("blog_posts").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      postId = data.id; created++;
    }

    // tags (+ Market Watch tag for MW posts, so the public page classifies it)
    const tagNames = [...m.tags]; if (m.detected_post_type === "market-watch") tagNames.push("Market Watch");
    const tagIds = await ensureTags(tagNames);
    await db.from("blog_post_tags").delete().eq("post_id", postId!);
    if (tagIds.length) await db.from("blog_post_tags").insert(tagIds.map((tag_id) => ({ post_id: postId!, tag_id })));

    // old-slug redirect only when the slug changed from the source
    if (row.slug !== m.source_slug) {
      await db.from("blog_post_slugs").upsert({ old_slug: m.source_slug, post_id: postId! }, { onConflict: "old_slug" });
    }

    // tracking row (full source metadata for audit + re-import). Explicit
    // insert/update keyed off the `existing` lookup — NOT upsert-onConflict,
    // because the (source_site, source_post_id) unique index is PARTIAL and
    // PostgREST cannot target a partial index as an ON CONFLICT spec.
    const importRow = {
      post_id: postId,
      source_site: SOURCE_SITE,
      source_post_id: String(m.source_id),
      canonical_source_url: m.canonical_source_url,
      normalized_source_url: m.normalized_source_url,
      source_slug: m.source_slug,
      source_checksum: m.checksum,
      destination_checksum_at_import: m.checksum,
      migration_batch_id: BATCH_ID,
      last_imported_at: new Date().toISOString(),
      import_status: "imported",
      review_required: true,
      missing_featured_image: Boolean(m.missing_featured_image),
      unresolved_image_count: (m.inline_image_count ?? 0) + (m.missing_featured_image ? 1 : 0),
      publish_time_inferred: Boolean(m.publish_time_inferred),
      slug_conflict: row.slug !== m.proposed_slug || Boolean(m.slug_conflict),
      metadata_incomplete: Boolean(m.metadata_incomplete),
      source_metadata: m,
    };
    const trk = existing
      ? await db.from("blog_post_imports").update(importRow).eq("id", existing.id)
      : await db.from("blog_post_imports").insert(importRow);
    if (trk.error) throw new Error(`tracking row: ${trk.error.message}`);

    results.push({ title: label, action: existing ? "updated" : "created", slug: row.slug, published_at: publishedAt });
    console.log(`  ${existing ? "updated" : "created"} ${label}  →  /blog/${row.slug}  (${publishedAt.slice(0, 10)})`);
  } catch (e) {
    failed++; results.push({ title: label, action: "FAILED", error: String(e).slice(0, 200) });
    console.log(`  FAIL   ${label}: ${String(e).slice(0, 160)}`);
  }
}

writeFileSync(join(OUT, "import-results.json"), JSON.stringify({ batch: BATCH_ID, mode: MODE, asDraft: AS_DRAFT, created, updated, skipped, failed, results }, null, 2));
console.log(`\nDONE. created=${created} updated=${updated} skipped=${skipped} failed=${failed}. Results → migration/import-results.json`);
console.log(AS_DRAFT ? "All imported as DRAFTS (not public). Review + publish from the admin portal." : "Imported with original publish state.");
