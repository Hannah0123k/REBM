/**
 * Generate the site-wide link-preview card (public/og-image.png).
 *
 * This is the thumbnail people see when the URL is texted, pasted into Slack or
 * LinkedIn, or bookmarked. The live WordPress site had no og:image, so crawlers
 * scraped Rhett's headshot off the page — the design Hannah asked for on
 * 2026-08-19 is the brand-blue card with the navy serif headline instead.
 *
 * Values are measured from the reference Hannah supplied, scaled from its
 * 1260px width to the 1200x630 (1.91:1) OG canvas that Facebook, X, iMessage,
 * Slack and LinkedIn all key off:
 *
 *   background   #689ECF  (--color-rebm-blue)
 *   text         #032C40  (--color-rebm-navy)
 *   left inset   74/1260  -> 70px
 *   line-height  108/1260 -> 103px
 *   line breaks  hard-set, exactly as the reference wraps them
 *
 * The headline is EB Garamond — a serif, unlike the site's Inter body face, and
 * the closest open-licensed match to the reference (compared against Cormorant
 * Garamond, Newsreader, Vollkorn and Sorts Mill Goudy at matched width). It is
 * SIL Open Font License, so there is none of the Helvetica exposure described in
 * CLAUDE.md. It is fetched at render time and baked into the PNG; no font is
 * shipped to browsers.
 *
 * Rendered at 2x and downsampled with sharp so the serifs stay crisp.
 *
 * Usage: node scripts/og-image.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;

const BLUE = "#689ECF";
const NAVY = "#032C40";

// Kept as three separate lines rather than a wrapping paragraph: the reference
// breaks after "Match" and after "real", and letting the browser rewrap would
// drift with any font-size change.
const LINES = [
  "Real Estate Broker Match",
  "makes finding the right real",
  "estate broker simple.",
];

const html = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&display=block">
<style>
  html, body { margin: 0; padding: 0; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: ${BLUE};
    display: flex;
    align-items: center;
  }
  .headline {
    font-family: "EB Garamond", Georgia, serif;
    font-weight: 500;
    font-size: 97px;
    line-height: 103px;
    color: ${NAVY};
    padding-left: 70px;
    padding-right: 70px;
    white-space: pre-line;
    letter-spacing: 0;
  }
</style>
<body><div class="headline">${LINES.join("\n")}</div></body>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
});
await page.setContent(html, { waitUntil: "networkidle" });

// setContent resolves before webfonts finish; without this the card renders in
// the Georgia fallback and the whole point is lost. Fail loudly rather than
// silently shipping the wrong face.
await page.evaluate(() => document.fonts.ready);
const ok = await page.evaluate(() => document.fonts.check('500 97px "EB Garamond"'));
if (!ok) {
  await browser.close();
  throw new Error("EB Garamond did not load — check network access to fonts.googleapis.com");
}

const measured = await page.evaluate(() => {
  const r = document.querySelector(".headline").getBoundingClientRect();
  return { width: Math.round(r.width), height: Math.round(r.height) };
});

const shot = await page.screenshot({ type: "png" });
await browser.close();

const png = await sharp(shot)
  .resize(WIDTH, HEIGHT, { fit: "fill", kernel: "lanczos3" })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

writeFileSync(OUT, png);
console.log(`wrote ${OUT}  ${WIDTH}x${HEIGHT}  ${(png.length / 1024).toFixed(1)} KB`);
console.log(`text block ${measured.width}x${measured.height}`);
