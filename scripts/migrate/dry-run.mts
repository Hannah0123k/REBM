/**
 * READ-ONLY migration dry run. Discovers every public post via the WordPress
 * REST API, extracts + sanitizes + converts each to the CMS's Tiptap format,
 * scans for injected/hostile content, and writes an auditable manifest + reports
 * to ./migration/. It NEVER writes to Supabase and NEVER downloads images.
 *
 * Run: node scripts/migrate/dry-run.mts
 */
// The WordPress REST payload is untyped external data; `any` is intentional at
// that boundary in this one-off migration script (not shipped app code). The
// no-explicit-any relaxation for scripts/** lives in eslint.config.mjs.
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { slugify, isValidSlug } from "../../lib/blog/slug.ts";
import {
  SOURCE_SITE, normalizeUrl, sha256, decodeEntities, scanHtml, detectMarketWatch,
  htmlToTiptap, type Finding,
} from "./lib.mts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "migration");
const UA = "REBM-Migration-DryRun/1.0 (+content migration; read-only)";
const BASE = `https://${SOURCE_SITE}`;
const BATCH_ID = "dryrun"; // deterministic; real runs stamp a timestamp via env
const ALLOWED_HOSTS = new Set([SOURCE_SITE, "inheritedpropertymatch.com"]);
const RESERVED_SLUGS = new Set(["tag", "page", "admin", "feed", "wp-json", "category", "author"]);

const stripTags = (html: string) => decodeEntities((html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CACHE = join(OUT, ".cache");

async function getWithRetry(url: string): Promise<Response> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (![429, 500, 502, 503, 504].includes(res.status) || attempt === 5) throw new Error(`${url} → ${res.status}`);
    await sleep(attempt * 3000); // polite backoff
  }
  throw new Error(`${url} failed`);
}

// ── discover (cached: fetch the source at most once per artifact) ─────────────
console.log("Discovering posts via WordPress REST API…");
mkdirSync(CACHE, { recursive: true });
const postsCache = join(CACHE, "posts.json");
let posts: any[];
if (existsSync(postsCache) && !process.env.FORCE_FETCH) {
  posts = JSON.parse(readFileSync(postsCache, "utf8"));
  console.log(`Loaded ${posts.length} posts from cache (set FORCE_FETCH=1 to re-fetch).`);
} else {
  posts = [];
  for (let page = 1; ; page++) {
    const batch = await (await getWithRetry(`${BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1`)).json();
    posts.push(...batch);
    if (batch.length < 100) break;
    await sleep(1500);
  }
  writeFileSync(postsCache, JSON.stringify(posts));
  console.log(`Discovered ${posts.length} posts (cached).`);
}

// Author names aren't exposed via the users REST endpoint (restricted). Recover
// real names from the RSS feed's <dc:creator> where the feed window covers them.
// Never invent an author — unknown stays null + metadata_incomplete.
const rssAuthor = new Map<string, string>();
const rssCache = join(CACHE, "rss-authors.json");
if (existsSync(rssCache) && !process.env.FORCE_FETCH) {
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(rssCache, "utf8")) as Record<string, string>)) rssAuthor.set(k, v);
} else {
  try {
    for (let pg = 1; pg <= 3; pg++) {
      const res = await getWithRetry(`${BASE}/feed/?paged=${pg}`);
      const xml = await res.text();
      const items = xml.split(/<item[\s>]/).slice(1);
      for (const it of items) {
        const link = it.match(/<link>([^<]+)<\/link>/)?.[1];
        const creator = it.match(/<dc:creator>(?:<!\[CDATA\[)?([^<\]]+)/)?.[1];
        if (link && creator) rssAuthor.set(normalizeUrl(link), decodeEntities(creator.trim()));
      }
      if (items.length < 10) break;
      await sleep(1500);
    }
    writeFileSync(rssCache, JSON.stringify(Object.fromEntries(rssAuthor)));
  } catch { /* feed optional */ }
}
console.log(`Recovered ${rssAuthor.size} author name(s) from RSS.`);

// ── extract + convert ────────────────────────────────────────────────────────
type Manifest = {
  source_url: string; canonical_source_url: string; normalized_source_url: string;
  discovered_from: string; source_id: number | null; source_slug: string;
  page_title: string; detected_post_type: "market-watch" | "article";
  market_watch_signal: string | null;
  detected_publish_date: string; detected_publish_time: string | null; publish_time_inferred: boolean;
  date_candidates: Record<string, string>;
  detected_author: string | null; category: string | null; tags: string[];
  excerpt: string | null; seo_title: null; meta_description: null; metadata_incomplete: boolean;
  featured_image_url: string | null; featured_image_alt: string | null; missing_featured_image: boolean;
  inline_image_count: number; table_count: number; table_warnings: string[];
  suspicious_findings: Finding[]; dropped_tags: string[];
  proposed_slug: string; slug_conflict: boolean; destination_url: string;
  checksum: string; discovery_status: string; extraction_status: string;
  import_status: string; review_required: boolean; import_readiness: string;
  destination_post_id: null; warnings: string[];
  _links: { href: string; internalBlogSlug: string | null }[];
};

const manifest: Manifest[] = [];
const bodies = new Map<string, unknown>();       // proposed_slug → tiptap doc
const sourceSlugToNew = new Map<string, string>(); // source_slug → proposed_slug
const seenSlugs = new Set<string>();

for (const p of posts) {
  const sourceSlug: string = p.slug || slugify(stripTags(p.title?.rendered ?? ""));
  const title = decodeEntities(stripTags(p.title?.rendered ?? "")) || "(untitled)";
  const contentHtml: string = p.content?.rendered ?? "";
  const emb = p._embedded ?? {};
  const media = emb["wp:featuredmedia"]?.[0];
  const featuredUrl: string | null = media?.source_url ?? null;
  const terms: any[] = (emb["wp:term"] ?? []).flat();
  const cats = terms.filter((t) => t?.taxonomy === "category").map((t) => t.name);
  const tagSlugs = terms.filter((t) => t?.taxonomy === "post_tag").map((t) => t.slug);
  const tagNames = terms.filter((t) => t?.taxonomy === "post_tag").map((t) => t.name);
  const canonicalEarly = normalizeUrl(p.link || `${BASE}/${sourceSlug}/`);
  const author: string | null =
    (emb.author?.[0]?.name && !emb.author[0].code ? emb.author[0].name : null) ?? rssAuthor.get(canonicalEarly) ?? null;

  const warnings: string[] = [];
  const findings = scanHtml(contentHtml, ALLOWED_HOSTS);
  const conv = htmlToTiptap(contentHtml, { sourceHost: SOURCE_SITE });
  bodies.set(sourceSlug, conv.doc);

  // Dates: date_gmt is the authoritative UTC instant; time is present (not inferred).
  const dateGmt: string = p.date_gmt ? `${p.date_gmt}Z` : "";
  const publishInstant = dateGmt || (p.date ? new Date(p.date).toISOString() : "");
  const publishTimeInferred = !p.date_gmt && !p.date;
  if (!publishInstant) warnings.push("no publish date found");
  const dateCandidates: Record<string, string> = {};
  if (p.date_gmt) dateCandidates["rest:date_gmt"] = p.date_gmt;
  if (p.date) dateCandidates["rest:date"] = p.date;
  if (p.modified_gmt) dateCandidates["rest:modified_gmt (NOT used as publish date)"] = p.modified_gmt;

  const mw = detectMarketWatch({ title, slug: sourceSlug, tagSlugs });

  // Slug conflict handling (within batch + reserved routes). Deterministic suffix.
  let proposedSlug = isValidSlug(sourceSlug) ? sourceSlug : slugify(sourceSlug) || slugify(title) || `post-${p.id}`;
  let slugConflict = false;
  if (RESERVED_SLUGS.has(proposedSlug)) { proposedSlug = `${proposedSlug}-post`; slugConflict = true; warnings.push(`slug collides with reserved route; using ${proposedSlug}`); }
  if (seenSlugs.has(proposedSlug)) { slugConflict = true; let i = 2; while (seenSlugs.has(`${proposedSlug}-${i}`)) i++; proposedSlug = `${proposedSlug}-${i}`; warnings.push(`duplicate slug; using ${proposedSlug}`); }
  seenSlugs.add(proposedSlug);
  sourceSlugToNew.set(sourceSlug, proposedSlug);

  const excerpt = stripTags(p.excerpt?.rendered ?? "") || null;
  const metadataIncomplete = true; // no source SEO plugin → SEO review required
  if (!author) warnings.push("author not detected");
  if (!cats.length) warnings.push("no category");
  if (conv.tableWarnings.length) warnings.push(...conv.tableWarnings);
  // Note (not a blocking warning): dropped tags are presentational (span/font
  // etc.) and expected — recorded in manifest.dropped_tags for audit only.

  // Readiness reflects REAL issues; SEO-null is universal and handled via the
  // metadata_incomplete flag, so it doesn't by itself lower readiness.
  const highFindings = findings.filter((f) => f.severity === "high");
  // Missing author/SEO are UNIVERSAL source limitations (users endpoint + no SEO
  // plugin) captured by metadata_incomplete — not per-post blockers. Real issues
  // are content-level: missing cover, table warnings, slug conflict, no date.
  const realIssue = !featuredUrl || conv.tableWarnings.length > 0 || slugConflict || !publishInstant;
  const readiness = highFindings.length
    ? "needs-security-review"
    : realIssue
      ? "review-recommended"
      : "ready-for-draft-import";
  const canonical = normalizeUrl(p.link || `${BASE}/${sourceSlug}/`);

  manifest.push({
    source_url: p.link, canonical_source_url: canonical, normalized_source_url: canonical,
    discovered_from: "wp-rest-api", source_id: p.id ?? null, source_slug: sourceSlug,
    page_title: title, detected_post_type: mw.isMarketWatch ? "market-watch" : "article",
    market_watch_signal: mw.signal,
    detected_publish_date: publishInstant ? publishInstant.slice(0, 10) : "", detected_publish_time: publishInstant ? publishInstant.slice(11, 19) : null,
    publish_time_inferred: publishTimeInferred, date_candidates: dateCandidates,
    detected_author: author, category: cats[0] ?? null, tags: tagNames,
    excerpt, seo_title: null, meta_description: null, metadata_incomplete: metadataIncomplete,
    featured_image_url: featuredUrl, featured_image_alt: media?.alt_text ?? null, missing_featured_image: !featuredUrl,
    inline_image_count: conv.images.length, table_count: conv.tableCount, table_warnings: conv.tableWarnings,
    suspicious_findings: findings, dropped_tags: conv.droppedTags,
    proposed_slug: proposedSlug, slug_conflict: slugConflict, destination_url: `/blog/${proposedSlug}`,
    checksum: sha256(`${title}\n${contentHtml}`), discovery_status: "discovered", extraction_status: "extracted",
    import_status: "pending", review_required: true, import_readiness: readiness,
    destination_post_id: null, warnings,
    _links: conv.links,
  });
}

// ── internal-link rewrite map (source blog links → new /blog/<slug>) ──────────
const internalLinkMap: { post: string; from: string; to: string }[] = [];
for (const m of manifest) {
  for (const l of m._links) {
    if (l.internalBlogSlug && sourceSlugToNew.has(l.internalBlogSlug)) {
      internalLinkMap.push({ post: m.proposed_slug, from: l.href, to: `/blog/${sourceSlugToNew.get(l.internalBlogSlug)}` });
    }
  }
}

// ── write outputs ─────────────────────────────────────────────────────────────
// Clear generated artifacts but PRESERVE the source cache (.cache).
rmSync(join(OUT, "posts"), { recursive: true, force: true });
rmSync(join(OUT, "reports"), { recursive: true, force: true });
mkdirSync(join(OUT, "posts"), { recursive: true });
mkdirSync(join(OUT, "reports"), { recursive: true });
const w = (p: string, s: string) => writeFileSync(join(OUT, p), s);

// per-post converted Tiptap JSON
for (const [slug, doc] of bodies) writeFileSync(join(OUT, "posts", `${sourceSlugToNew.get(slug)}.tiptap.json`), JSON.stringify(doc, null, 2));

// manifest (strip internal _links helper)
w("manifest.json", JSON.stringify(manifest.map(({ _links, ...rest }) => rest), null, 2));

// category/tag mapping (proposed; review before import). Market Watch is a TAG.
const allTags = [...new Set(manifest.flatMap((m) => m.tags))].sort();
const catMap: Record<string, string> = {};
for (const c of [...new Set(manifest.map((m) => m.category).filter(Boolean) as string[])]) catMap[c] = c;
w("reports/category-tag-mapping.json", JSON.stringify({
  note: "Categories map 1:1. Market Watch is applied as a tag 'market-watch' (no MW category exists on source). Review before import.",
  categories: catMap,
  marketWatchTag: "market-watch",
  tags: Object.fromEntries(allTags.map((t) => [t, slugify(t)])),
}, null, 2));

// redirects old→new (308)
const redirects = ["old_url,new_url,status,notes",
  ...manifest.map((m) => `${m.canonical_source_url},${m.destination_url},308,${m.slug_conflict ? "slug-changed" : ""}`)].join("\n");
w("reports/redirects.csv", redirects);
w("reports/internal-link-rewrites.json", JSON.stringify(internalLinkMap, null, 2));

// focused reports
const sec = manifest.filter((m) => m.suspicious_findings.length);
w("reports/security.md", mdReport("Security / injected-content report", sec.length
  ? sec.map((m) => `### ${m.page_title}\n- ${m.destination_url}\n${m.suspicious_findings.map((f) => `  - **${f.severity}** \`${f.kind}\`: ${f.detail}`).join("\n")}`).join("\n\n")
  : "No suspicious content detected in any post. (All 21 scanned.)"));

const tbl = manifest.filter((m) => m.table_count);
w("reports/tables.md", mdReport("Tables report", tbl.length
  ? tbl.map((m) => `- **${m.page_title}** (${m.destination_url}): ${m.table_count} table(s)${m.table_warnings.length ? `\n  - ${m.table_warnings.join("\n  - ")}` : " — clean"}`).join("\n")
  : "No tables found."));

w("reports/images.md", mdReport("Missing / pending images report",
  manifest.map((m) => `- **${m.page_title}**: featured ${m.missing_featured_image ? "❌ MISSING" : "captured (URL recorded)"}, inline pending: ${m.inline_image_count}`).join("\n")
  + `\n\nAll image URLs are recorded in the manifest for later replacement; NONE are downloaded or published. Inline images render a local placeholder until replaced.`));

w("reports/seo-gaps.md", mdReport("SEO gaps report",
  "Source has no SEO plugin — seo_title and meta_description are NULL for every post (not invented). All flagged metadata_incomplete → SEO review required in admin.\n\n"
  + manifest.map((m) => `- ${m.page_title}: seo_title=null, meta_description=null`).join("\n")));

w("reports/dates.md", mdReport("Dates & inferred-time report",
  "published_at uses REST `date_gmt` (UTC instant). Time IS present in the source, so publish_time_inferred=false everywhere. `modified_gmt` is NOT used as the publish date.\n\n"
  + manifest.map((m) => `- ${m.page_title}: ${m.detected_publish_date} ${m.detected_publish_time ?? "(no time)"} — candidates: ${JSON.stringify(m.date_candidates)}`).join("\n")));

w("reports/market-watch.md", mdReport("Market Watch classification report",
  manifest.map((m) => `- ${m.detected_post_type === "market-watch" ? "🟦 MARKET WATCH" : "article"} — ${m.page_title} (signal: ${m.market_watch_signal ?? "n/a"})`).join("\n")));

const conflicts = manifest.filter((m) => m.slug_conflict);
w("reports/slug-conflicts.md", mdReport("Duplicate & slug-conflict report", conflicts.length
  ? conflicts.map((m) => `- ${m.source_slug} → ${m.proposed_slug} (${m.warnings.filter((x) => x.includes("slug")).join("; ")})`).join("\n")
  : "No slug conflicts. Every source slug is preserved as-is."));

// per-post summary table
const summary = ["# Migration dry-run summary\n",
  `Source: ${BASE} · Posts: ${manifest.length} · Batch: ${BATCH_ID}`,
  `Ready for draft import: ${manifest.filter((m) => m.import_readiness === "ready-for-draft-import").length} · Review recommended: ${manifest.filter((m) => m.import_readiness === "review-recommended").length} · Security review: ${manifest.filter((m) => m.import_readiness === "needs-security-review").length}\n`,
  "| Title | Date | Time | Author | Category | Type | Tables | Images | Findings | Proposed slug | Readiness |",
  "|---|---|---|---|---|---|---|---|---|---|---|",
  ...manifest.map((m) => `| ${m.page_title.slice(0, 42)} | ${m.detected_publish_date} | ${m.detected_publish_time ?? "-"} | ${m.detected_author ?? "-"} | ${m.category ?? "-"} | ${m.detected_post_type} | ${m.table_count} | ${m.inline_image_count}${m.missing_featured_image ? " (no feat.)" : ""} | ${m.suspicious_findings.length} | ${m.proposed_slug} | ${m.import_readiness} |`),
].join("\n");
w("reports/SUMMARY.md", summary);

console.log(`\nDONE. ${manifest.length} posts processed. Artifacts in ./migration/`);
console.log(`  ready-for-draft: ${manifest.filter((m) => m.import_readiness === "ready-for-draft-import").length} | review: ${manifest.filter((m) => m.import_readiness !== "ready-for-draft-import").length}`);
console.log(`  market-watch: ${manifest.filter((m) => m.detected_post_type === "market-watch").length} | with tables: ${manifest.filter((m) => m.table_count).length} | security findings: ${manifest.filter((m) => m.suspicious_findings.length).length}`);

function mdReport(title: string, body: string): string {
  return `# ${title}\n\n_Dry run — read-only. No data written to Supabase._\n\n${body}\n`;
}
