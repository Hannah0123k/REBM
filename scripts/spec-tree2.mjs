/**
 * Walk a chosen subtree of the live homepage with full geometry, so section
 * boundaries come from the render rather than from guessed class names.
 * Usage: node scripts/spec-tree2.mjs <selector> <depth> [url]
 */
import { chromium } from "playwright";

const sel = process.argv[2] ?? ".entry-content";
const depth = Number(process.argv[3] ?? 3);
const url = process.argv[4] ?? "https://realestatebrokermatch.com/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => {
      scrollTo(0, y);
      y += 700;
      if (y > document.body.scrollHeight) {
        clearInterval(t);
        scrollTo(0, 0);
        r();
      }
    }, 30);
  });
});
await page.waitForTimeout(2000);
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(600);

const lines = await page.evaluate(
  ({ sel, maxDepth }) => {
    const out = [];
    const roots = document.querySelectorAll(sel);
    const walk = (el, d) => {
      if (d > maxDepth) return;
      const r = el.getBoundingClientRect();
      if (r.height < 5) return;
      const cs = getComputedStyle(el);
      const cls = (el.className || "").toString().trim().split(/\s+/).slice(0, 3).join(".");
      out.push(
        `${"  ".repeat(d)}${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""}  ` +
          `[y=${Math.round(r.top + scrollY)}→${Math.round(r.bottom + scrollY)} h=${Math.round(r.height)} w=${Math.round(r.width)} x=${Math.round(r.left)}] ` +
          `bg=${cs.backgroundColor}${cs.backgroundImage !== "none" ? " IMG" : ""} pos=${cs.position}`,
      );
      for (const c of el.children) walk(c, d + 1);
    };
    for (const root of roots) walk(root, 0);
    return out;
  },
  { sel, maxDepth: depth },
);
console.log(lines.join("\n"));
await browser.close();
