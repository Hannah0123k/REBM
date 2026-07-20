/**
 * Migration helpers — HTML→Tiptap conversion, sanitization pass-through,
 * security scanning, Market Watch detection, URL/checksum utilities.
 *
 * SAFETY: the source site is treated as HOSTILE input. Only text + a fixed set
 * of safe structural nodes are produced; the result is additionally run through
 * the app's own sanitizeDoc() before it would ever be stored. No source markup,
 * styles, scripts, handlers, or unknown embeds survive. INLINE IMAGES become a
 * local placeholder node (never the compromised host's URL) with the original
 * URL recorded in metadata for later replacement.
 */
import { createHash } from "node:crypto";

import { parse, HTMLElement, TextNode, type Node as HNode } from "node-html-parser";

import { sanitizeDoc } from "../../lib/blog/sanitize.ts";

export const SOURCE_SITE = "realestatebrokermatch.com";
export const INLINE_IMAGE_PLACEHOLDER = "/assets/blog/placeholder.png";
const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;
const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mc_cid", "mc_eid"];

// ── URLs ─────────────────────────────────────────────────────────────────────
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    u.host = u.host.toLowerCase();
    u.hash = "";
    for (const p of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.includes(p.toLowerCase())) u.searchParams.delete(p);
    }
    let s = u.toString();
    s = s.replace(/\/$/, ""); // drop trailing slash
    return s;
  } catch {
    return raw.trim().replace(/\/$/, "");
  }
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// ── entities ─────────────────────────────────────────────────────────────────
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…",
  mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  copy: "©", reg: "®", trade: "™", deg: "°", times: "×", middot: "·",
};
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => (name.toLowerCase() in NAMED ? NAMED[name.toLowerCase()] : m));
}
function safeCodePoint(n: number): string {
  try { return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ""; } catch { return ""; }
}

// ── security scan (hostile-input flags) ──────────────────────────────────────
const SPAM_TERMS = [
  "viagra", "cialis", "casino", "porn", "payday loan", "crypto giveaway", "bitcoin doubler",
  "replica watch", "essay writing service", "buy followers", "sex", "xxx", "pharmacy",
];
export type Finding = { severity: "high" | "medium" | "low"; kind: string; detail: string };

export function scanHtml(html: string, allowedHosts: Set<string>): Finding[] {
  const f: Finding[] = [];
  const push = (severity: Finding["severity"], kind: string, detail: string) => f.push({ severity, kind, detail });

  if (/<script[\s>]/i.test(html)) push("high", "script", "<script> tag present in source");
  if (/\son\w+\s*=/i.test(html)) push("high", "event-handler", "inline on* event handler present");
  if (/javascript:/i.test(html)) push("high", "js-url", "javascript: URL present");
  if (/<iframe[\s>]/i.test(html)) push("high", "iframe", "<iframe> present");
  if (/<form[\s>]/i.test(html)) push("medium", "form", "<form> present");
  if (/style\s*=\s*["'][^"']*(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|opacity\s*:\s*0)/i.test(html))
    push("high", "hidden-text", "inline style hiding content (possible cloaked spam)");
  if (/<img[^>]+width\s*=\s*["']?[01]["']?[^>]*height\s*=\s*["']?[01]/i.test(html))
    push("medium", "tracking-pixel", "1×1 image (possible tracking pixel)");

  const text = stripTags(html).toLowerCase();
  for (const term of SPAM_TERMS) {
    // Word-boundary match so legitimate words aren't flagged
    // (e.g. "cialis" must not match "spe[cialis]t").
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) push("high", "spam-keyword", `spam/adult/pharma term: "${term}"`);
  }

  // foreign / unknown outbound domains
  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const foreign = new Set<string>();
  for (const h of hrefs) {
    try {
      if (/^https?:/i.test(h)) {
        const host = new URL(h).host.toLowerCase().replace(/^www\./, "");
        if (![...allowedHosts].some((a) => host === a || host.endsWith("." + a))) foreign.add(host);
      }
    } catch { /* ignore */ }
  }
  if (foreign.size) push("medium", "foreign-links", `outbound links to unrecognized domains: ${[...foreign].sort().join(", ")}`);

  // crude non-Latin script block detection (unexpected language change)
  if (/[Ѐ-ӿ؀-ۿ一-鿿]{6,}/.test(text)) push("medium", "language", "long non-Latin-script run (unexpected language)");

  return f;
}
function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

// ── Market Watch detection ───────────────────────────────────────────────────
export function detectMarketWatch(opts: { title: string; slug: string; tagSlugs: string[] }): { isMarketWatch: boolean; signal: string | null } {
  const t = opts.title.toLowerCase();
  const s = opts.slug.toLowerCase();
  if (opts.tagSlugs.some((x) => x === "market-watch" || x === "market-pulse")) return { isMarketWatch: true, signal: "tag" };
  if (/market\s*pulse|market\s*watch/.test(t)) return { isMarketWatch: true, signal: "title" };
  if (/market-pulse|market-watch/.test(s)) return { isMarketWatch: true, signal: "slug" };
  return { isMarketWatch: false, signal: null };
}

// ── HTML → Tiptap conversion ─────────────────────────────────────────────────
export type ImageRef = { original_url: string; original_alt: string; original_caption: string; image_role: "inline"; article_position: number; replacement_status: "pending"; replacement_storage_path: null };
export type LinkRef = { href: string; internalBlogSlug: string | null };
export type ConvertResult = {
  doc: unknown;
  images: ImageRef[];
  links: LinkRef[];
  tableCount: number;
  tableWarnings: string[];
  droppedTags: string[];
};

const HEADING = { H1: 2, H2: 2, H3: 3, H4: 4, H5: 4, H6: 4 } as const;

export function htmlToTiptap(html: string, ctx: { sourceHost: string }): ConvertResult {
  const root = parse(html, { comment: false });
  const images: ImageRef[] = [];
  const links: LinkRef[] = [];
  const dropped = new Set<string>();
  let tableCount = 0;
  const tableWarnings: string[] = [];

  const isEl = (n: HNode): n is HTMLElement => n instanceof HTMLElement;
  const tag = (n: HTMLElement) => n.tagName?.toUpperCase() ?? "";
  const isHidden = (n: HTMLElement) => {
    const st = (n.getAttribute("style") || "").toLowerCase();
    return n.getAttribute("hidden") != null || /display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|opacity\s*:\s*0/.test(st);
  };

  type TNode = { type: string; attrs?: Record<string, unknown>; content?: TNode[]; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] };

  // Inline: produce text nodes with marks.
  function inline(nodes: HNode[], marks: TNode["marks"] = []): TNode[] {
    const out: TNode[] = [];
    for (const n of nodes) {
      if (n instanceof TextNode) {
        const text = decodeEntities(n.rawText);
        if (text) out.push({ type: "text", text, ...(marks.length ? { marks } : {}) });
      } else if (isEl(n)) {
        if (isHidden(n)) continue;
        const t = tag(n);
        if (t === "BR") { out.push({ type: "hardBreak" }); continue; }
        if (t === "IMG") { const img = imageNode(n); if (img) out.push(img); continue; }
        let m = marks;
        if (t === "STRONG" || t === "B") m = addMark(m, { type: "bold" });
        else if (t === "EM" || t === "I") m = addMark(m, { type: "italic" });
        else if (t === "S" || t === "DEL" || t === "STRIKE") m = addMark(m, { type: "strike" });
        else if (t === "CODE") m = addMark(m, { type: "code" });
        else if (t === "A") {
          const href = n.getAttribute("href") || "";
          if (SAFE_HREF.test(href)) { m = addMark(m, { type: "link", attrs: { href } }); recordLink(href); }
        } else if (!["SPAN", "U", "SUP", "SUB", "SMALL", "FONT", "MARK", "ABBR", "TIME"].includes(t)) {
          dropped.add(t);
        }
        out.push(...inline(n.childNodes, m));
      }
    }
    return out;
  }
  function addMark(marks: TNode["marks"], m: { type: string; attrs?: Record<string, unknown> }): TNode["marks"] {
    return marks!.some((x) => x.type === m.type) ? marks : [...marks!, m];
  }
  function recordLink(href: string) {
    let internalBlogSlug: string | null = null;
    try {
      if (/^https?:/i.test(href)) {
        const u = new URL(href);
        if (u.host.toLowerCase().replace(/^www\./, "") === ctx.sourceHost) {
          const seg = u.pathname.replace(/^\/|\/$/g, "").split("/");
          if (seg.length === 1 && seg[0]) internalBlogSlug = seg[0]; // /<slug>
        }
      }
    } catch { /* ignore */ }
    links.push({ href, internalBlogSlug });
  }
  function imageNode(n: HTMLElement): TNode | null {
    const src = n.getAttribute("src") || n.getAttribute("data-src") || "";
    if (!src) return null;
    images.push({
      original_url: src, original_alt: n.getAttribute("alt") || "", original_caption: "",
      image_role: "inline", article_position: images.length, replacement_status: "pending", replacement_storage_path: null,
    });
    // Never emit the source (compromised-host) URL — use a local placeholder.
    return { type: "image", attrs: { src: INLINE_IMAGE_PLACEHOLDER, alt: n.getAttribute("alt") || "", title: null } };
  }

  // Block conversion.
  function blocks(nodes: HNode[]): TNode[] {
    const out: TNode[] = [];
    for (const n of nodes) {
      if (n instanceof TextNode) {
        const text = decodeEntities(n.rawText).trim();
        if (text) out.push({ type: "paragraph", content: [{ type: "text", text }] });
        continue;
      }
      if (!isEl(n) || isHidden(n)) continue;
      const t = tag(n);
      switch (t) {
        case "SCRIPT": case "STYLE": case "IFRAME": case "FORM": case "NOSCRIPT": case "NAV":
        case "HEADER": case "FOOTER": case "ASIDE": case "BUTTON": case "SVG":
          dropped.add(t); break;
        case "H1": case "H2": case "H3": case "H4": case "H5": case "H6": {
          const content = inline(n.childNodes);
          if (hasText(content)) out.push({ type: "heading", attrs: { level: HEADING[t as keyof typeof HEADING] }, content });
          break;
        }
        case "P": case "DIV": case "SECTION": case "ARTICLE": case "FIGCAPTION": {
          const content = inline(n.childNodes);
          const blockKids = n.childNodes.filter((c) => isEl(c) && BLOCK_TAGS.has(tag(c as HTMLElement)));
          if (blockKids.length) out.push(...blocks(n.childNodes)); // container → recurse
          else if (hasContent(content)) out.push({ type: "paragraph", content });
          break;
        }
        case "UL": out.push(listNode(n, "bulletList")); break;
        case "OL": out.push(listNode(n, "orderedList")); break;
        case "BLOCKQUOTE": { const inner = blocks(n.childNodes); if (inner.length) out.push({ type: "blockquote", content: inner }); break; }
        case "PRE": { const code = decodeEntities(n.text); if (code.trim()) out.push({ type: "codeBlock", content: [{ type: "text", text: code }] }); break; }
        case "HR": out.push({ type: "horizontalRule" }); break;
        case "IMG": { const img = imageNode(n); if (img) out.push({ type: "paragraph", content: [img] }); break; }
        case "TABLE": { const tbl = tableNode(n); if (tbl) out.push(tbl); break; }
        case "FIGURE": out.push(...blocks(n.childNodes)); break;
        default: {
          const content = inline(n.childNodes);
          if (hasContent(content)) out.push({ type: "paragraph", content });
        }
      }
    }
    return out.filter((b) => b.type !== "paragraph" || hasContent(b.content ?? []));
  }
  function listNode(n: HTMLElement, type: "bulletList" | "orderedList"): TNode {
    const items: TNode[] = [];
    for (const li of n.childNodes) {
      if (isEl(li) && tag(li) === "LI") {
        const inner = blocks(li.childNodes);
        const content = inner.length ? inner : [{ type: "paragraph", content: inline(li.childNodes) }];
        items.push({ type: "listItem", content: content.length ? content : [{ type: "paragraph" }] });
      }
    }
    return { type, content: items.length ? items : [{ type: "listItem", content: [{ type: "paragraph" }] }] };
  }
  function tableNode(n: HTMLElement): TNode | null {
    tableCount += 1;
    const rows: TNode[] = [];
    const trs = n.querySelectorAll("tr");
    let cols = -1;
    for (const tr of trs) {
      const cells: TNode[] = [];
      for (const c of tr.childNodes) {
        if (!isEl(c)) continue;
        const ct = tag(c);
        if (ct !== "TD" && ct !== "TH") continue;
        const colspan = safeInt(c.getAttribute("colspan"));
        const rowspan = safeInt(c.getAttribute("rowspan"));
        const inner = blocks(c.childNodes);
        const content = inner.length ? inner : [{ type: "paragraph", content: inline(c.childNodes) }];
        cells.push({ type: ct === "TH" ? "tableHeader" : "tableCell", attrs: { colspan, rowspan, colwidth: null }, content: content.length ? content : [{ type: "paragraph" }] });
      }
      if (cells.length) {
        rows.push({ type: "tableRow", content: cells });
        const width = cells.reduce((a, c) => a + (Number(c.attrs?.colspan) || 1), 0);
        if (cols === -1) cols = width;
        else if (width !== cols) tableWarnings.push(`table ${tableCount}: ragged row (expected ${cols} cols, got ${width})`);
      }
    }
    if (!rows.length) { tableWarnings.push(`table ${tableCount}: no valid rows — dropped`); return null; }
    if (rows.some((r) => (r.content ?? []).some((c) => (Number(c.attrs?.rowspan) || 1) > 1)))
      tableWarnings.push(`table ${tableCount}: contains merged cells (rowspan) — verify rendering`);
    return { type: "table", content: rows };
  }

  const BLOCK_TAGS = new Set(["P", "DIV", "UL", "OL", "BLOCKQUOTE", "PRE", "HR", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6", "FIGURE", "SECTION", "ARTICLE"]);
  function safeInt(v: string | null | undefined): number { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 && n <= 1000 ? n : 1; }
  function hasText(content: TNode[]): boolean { return content.some((c) => (c.type === "text" && c.text?.trim()) || (c.content && hasText(c.content))); }
  function hasContent(content: TNode[]): boolean { return content.some((c) => c.type === "image" || c.type === "hardBreak" || (c.type === "text" && c.text?.trim()) || (c.content && hasContent(c.content))); }

  const body = blocks(root.childNodes);
  const rawDoc = { type: "doc", content: body.length ? body : [{ type: "paragraph" }] };
  // Final safety pass through the app's own sanitizer.
  const doc = sanitizeDoc(rawDoc);
  return { doc, images, links, tableCount, tableWarnings, droppedTags: [...dropped].sort() };
}
