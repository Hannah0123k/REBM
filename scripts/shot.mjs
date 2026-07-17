/**
 * Screenshot a page from the dev server for visual QA against Figma.
 *
 * Usage:
 *   node scripts/shot.mjs <path> <width> [outName]
 *   node scripts/shot.mjs / 1920 home-desktop
 *   node scripts/shot.mjs / 402  home-mobile
 *
 * Writes shots/<outName>.png (full page). Compare against the Figma renders
 * in the scratchpad — the frames are 1920 (desktop) and 402 (mobile).
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [path = "/", widthArg = "1920", outName] = process.argv.slice(2);
const width = Number(widthArg);
const name = outName ?? `${path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home"}-${width}`;

const OUT_DIR = join(ROOT, "shots");
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: 1080 },
  deviceScaleFactor: 1,
});

const url = `http://localhost:3000${path}`;
// 'load' not 'networkidle' — the dev server's HMR websocket never idles.
const res = await page.goto(url, { waitUntil: "load", timeout: 45000 });
if (!res?.ok()) {
  console.error(`! ${url} returned ${res?.status()}`);
  await browser.close();
  process.exit(1);
}

// Let webfonts settle so text metrics are stable before capture.
await page.evaluate(() => document.fonts.ready);

// Scroll through the page so lazy-loaded images/backgrounds decode before the
// full-page capture, then wait for all images to finish.
await page.evaluate(async () => {
  const step = window.innerHeight;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
  await Promise.all(
    [...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})),
  );
});
await page.waitForTimeout(300);

const out = join(OUT_DIR, `${name}.png`);
await page.screenshot({ path: out, fullPage: true });

const { scrollW, scrollH } = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  scrollH: document.documentElement.scrollHeight,
}));

console.log(`${out}\n  viewport ${width}  ·  page ${scrollW} × ${scrollH}`);
if (scrollW > width) {
  console.error(`  ⚠ horizontal overflow: content is ${scrollW - width}px wider than the viewport`);
}

await browser.close();
