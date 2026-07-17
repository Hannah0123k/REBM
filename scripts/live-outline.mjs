/**
 * Ordered content outline of the live homepage — the FINAL source of truth for
 * section order, wording, links, and images (CLAUDE.md → 2026-07-17 correction).
 *
 * Walks top-level sections in DOM order and dumps, per section: background,
 * headings, paragraphs, links (text → href), images (src + alt), and any
 * repeated card/testimonial/faq blocks — verbatim, in order.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "live-data");
const url = process.argv[2] ?? "https://realestatebrokermatch.com/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);

// expand any accordions/"show more" so hidden FAQ content is captured
await page.evaluate(() => {
  for (const b of document.querySelectorAll('button, [role="button"], .elementor-tab-title, summary')) {
    try { b.click(); } catch {}
  }
});
await page.waitForTimeout(500);

const outline = await page.evaluate(() => {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  // Elementor top-level blocks are .elementor-top-section (old) or
  // .e-con-boxed / top-level .e-con (flexbox containers). Fall back to <section>.
  let sections = [...document.querySelectorAll(".elementor-top-section, [data-elementor-type='wp-page'] > .elementor-section, .elementor > .e-con, .elementor-location-header, .elementor-location-footer")];
  if (sections.length < 3) {
    sections = [...document.querySelectorAll("header, section, footer, .elementor-section, .e-con")];
  }
  const seen = [];

  function summarize(root) {
    const rect = root.getBoundingClientRect();
    if (rect.height < 20) return null;
    const cs = getComputedStyle(root);
    const block = {
      y: Math.round(rect.top + window.scrollY),
      h: Math.round(rect.height),
      bg: cs.backgroundColor,
      headings: [],
      paragraphs: [],
      links: [],
      images: [],
      lists: [],
    };
    for (const h of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const t = clean(h.textContent);
      if (t) block.headings.push(`${h.tagName} ${t}`);
    }
    for (const p of root.querySelectorAll("p")) {
      const t = clean(p.textContent);
      if (t && t.length > 1) block.paragraphs.push(t);
    }
    for (const a of root.querySelectorAll("a")) {
      const t = clean(a.textContent);
      if (t) block.links.push(`${t} → ${a.getAttribute("href")}`);
    }
    for (const img of root.querySelectorAll("img")) {
      block.images.push(`${img.getAttribute("alt") || "(no alt)"} :: ${img.currentSrc || img.src}`);
    }
    for (const li of root.querySelectorAll("li")) {
      const t = clean(li.textContent);
      if (t && t.length > 1) block.lists.push(t);
    }
    return block;
  }

  // Only keep sections that are NOT nested inside another kept section, to get
  // the top-level order without duplication.
  const kept = [];
  for (const s of sections) {
    if (kept.some((k) => k.contains(s))) continue;
    kept.push(s);
  }
  kept.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  for (const s of kept) {
    const b = summarize(s);
    if (b) seen.push(b);
  }
  return seen;
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "outline.json"), JSON.stringify(outline, null, 2));

let n = 0;
for (const s of outline) {
  n++;
  console.log(`\n${"═".repeat(70)}`);
  console.log(`SECTION ${n}  y=${s.y} h=${s.h}  bg=${s.bg}`);
  if (s.headings.length) console.log("  HEADINGS:\n" + s.headings.map((h) => "    " + h).join("\n"));
  if (s.paragraphs.length)
    console.log("  PARAGRAPHS:\n" + s.paragraphs.map((p) => "    • " + p.slice(0, 160)).join("\n"));
  if (s.lists.length) console.log("  LIST ITEMS:\n" + s.lists.map((l) => "    - " + l.slice(0, 120)).join("\n"));
  if (s.links.length) console.log("  LINKS:\n" + [...new Set(s.links)].map((l) => "    " + l).join("\n"));
  if (s.images.length) console.log("  IMAGES:\n" + s.images.map((i) => "    " + i).join("\n"));
}
console.log(`\n\nfull JSON → live-data/outline.json  (${outline.length} sections)`);
await browser.close();
