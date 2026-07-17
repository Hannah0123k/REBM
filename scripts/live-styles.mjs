/**
 * Extract COMPUTED styles from the live site.
 *
 * The Figma file turned out to be an older design than realestatebrokermatch.com
 * (different logo, no FAQ, different type scale), and Hannah confirmed the live
 * site is what the rebuild must match 1:1. So the live site's own computed CSS —
 * not Figma — is the design authority for anything this reports.
 *
 * Usage: node scripts/live-styles.mjs [url]
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

const report = await page.evaluate(() => {
  const seen = new Set();
  const out = { typography: [], colors: {}, containers: [], images: [], fonts: [] };

  const px = (v) => (v && v !== "0px" ? v : null);

  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (cs.visibility === "hidden" || cs.display === "none") continue;

    // typography of elements that directly contain text
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (ownText.length > 1) {
      const key = [
        cs.fontFamily,
        cs.fontSize,
        cs.fontWeight,
        cs.lineHeight,
        cs.letterSpacing,
        cs.color,
        cs.textTransform,
      ].join("|");
      if (!seen.has(key)) {
        seen.add(key);
        out.typography.push({
          tag: el.tagName.toLowerCase(),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          textTransform: cs.textTransform,
          sample: ownText.slice(0, 70),
        });
      }
    }

    // background colours actually painted
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && rect.width > 200 && rect.height > 40) {
      out.colors[bg] = (out.colors[bg] ?? 0) + 1;
    }

    // candidate content containers
    if (rect.width > 600 && rect.width < 1900 && (px(cs.maxWidth) || px(cs.paddingLeft))) {
      const key = `${Math.round(rect.width)}|${cs.maxWidth}|${cs.paddingLeft}`;
      if (!seen.has("c" + key)) {
        seen.add("c" + key);
        out.containers.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 60),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          maxWidth: cs.maxWidth,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
        });
      }
    }

    if (el.tagName === "IMG") {
      out.images.push({
        src: el.currentSrc || el.src,
        natural: `${el.naturalWidth}×${el.naturalHeight}`,
        rendered: `${Math.round(rect.width)}×${Math.round(rect.height)}`,
        alt: el.alt?.slice(0, 40) ?? "",
      });
    }
  }

  out.fonts = [...new Set([...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style}`))];
  return out;
});

mkdirSync(OUT, { recursive: true });
const slug = new URL(url).pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(report, null, 2));

console.log(`\n=== ${url} ===`);
console.log(`\nFONT FACES LOADED (${report.fonts.length}):`);
report.fonts.forEach((f) => console.log("  " + f));

console.log(`\nTYPOGRAPHY (${report.typography.length} distinct):`);
for (const t of report.typography) {
  console.log(
    `  ${t.tag.padEnd(6)} ${t.fontSize.padStart(6)}/${t.lineHeight.padEnd(8)} w${t.fontWeight.padEnd(4)} ${t.color.padEnd(22)} ${t.fontFamily.split(",")[0].slice(0, 22).padEnd(24)} "${t.sample.slice(0, 40)}"`,
  );
}

console.log(`\nBACKGROUND COLOURS (by element count):`);
Object.entries(report.colors)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([c, n]) => console.log(`  ${c.padEnd(26)} ×${n}`));

console.log(`\nCONTAINERS:`);
report.containers.slice(0, 10).forEach((c) => {
  console.log(`  ${c.tag.padEnd(5)} w=${String(c.width).padEnd(5)} left=${String(c.left).padEnd(5)} max=${c.maxWidth.padEnd(9)} padL=${c.paddingLeft}  ${c.cls}`);
});

console.log(`\nIMAGES (${report.images.length}):`);
report.images.slice(0, 12).forEach((i) =>
  console.log(`  ${i.rendered.padEnd(12)} nat=${i.natural.padEnd(12)} ${i.src.split("/").pop()?.slice(0, 42)}`),
);

console.log(`\nfull JSON → live-data/${slug}.json`);
await browser.close();
