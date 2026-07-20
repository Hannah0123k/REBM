/**
 * Find (and optionally delete) orphaned blog images — storage objects recorded
 * in `media_assets` that no post references any more (neither as a featured
 * image nor inside a body). Cleans up after image replacements/removals.
 *
 * SAFETY: dry-run by default — it only PRINTS orphans. Pass `--delete` to
 * remove them (storage object + media_assets row). Prints a summary either way;
 * nothing is deleted silently.
 *
 * Requires an admin context, so this reads the SERVICE ROLE key — which the app
 * itself never uses. Set it only in your shell for this run:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/blog-orphan-images.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/blog-orphan-images.mjs --delete
 * NEXT_PUBLIC_SUPABASE_URL is read from .env.local.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DELETE = process.argv.includes("--delete");
const BUCKET = "blog-images";

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing from .env.local");
if (!serviceKey) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY in your shell (see file header).");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

/** Every image URL referenced by any post (featured image + inline body images). */
function collectReferences(posts) {
  const refs = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "image" && node.attrs?.src) refs.add(String(node.attrs.src));
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  for (const p of posts) {
    if (p.featured_image_url) refs.add(p.featured_image_url);
    walk(p.body);
  }
  return refs;
}

const { data: posts, error: postsErr } = await supabase
  .from("blog_posts")
  .select("featured_image_url, body");
if (postsErr) throw new Error(`posts: ${postsErr.message}`);

const { data: assets, error: assetsErr } = await supabase
  .from("media_assets")
  .select("id, storage_path, public_url");
if (assetsErr) throw new Error(`media_assets: ${assetsErr.message}`);

const referenced = collectReferences(posts ?? []);
const orphans = (assets ?? []).filter(
  (a) => !referenced.has(a.public_url) && ![...referenced].some((r) => r.endsWith(a.storage_path)),
);

console.log(`Posts: ${posts?.length ?? 0} · media_assets: ${assets?.length ?? 0} · orphans: ${orphans.length}`);
for (const o of orphans) console.log(`  orphan  ${o.storage_path}`);

if (!DELETE) {
  console.log(orphans.length ? "\nDry run. Re-run with --delete to remove these." : "\nNothing to clean up.");
  process.exit(0);
}

if (orphans.length) {
  const paths = orphans.map((o) => o.storage_path);
  const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
  if (rmErr) throw new Error(`storage remove: ${rmErr.message}`);
  const { error: delErr } = await supabase
    .from("media_assets")
    .delete()
    .in("id", orphans.map((o) => o.id));
  if (delErr) throw new Error(`media_assets delete: ${delErr.message}`);
  console.log(`\nDeleted ${orphans.length} orphaned image(s).`);
}
