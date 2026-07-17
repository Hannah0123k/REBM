/**
 * Print the real top-of-DOM tree of the live homepage so we can find the actual
 * section boundaries instead of guessing at framework class names.
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://realestatebrokermatch.com/";
const depth = Number(process.argv[3] ?? 4);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

const lines = await page.evaluate((maxDepth) => {
  const out = [];
  const walk = (el, d) => {
    if (d > maxDepth) return;
    const r = el.getBoundingClientRect();
    if (r.height < 5) return;
    const cs = getComputedStyle(el);
    const cls = (el.className || "").toString().trim().split(/\s+/).slice(0, 4).join(".");
    out.push(
      `${"  ".repeat(d)}${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""}  ` +
        `[y=${Math.round(r.top + scrollY)}→${Math.round(r.bottom + scrollY)} h=${Math.round(r.height)} w=${Math.round(r.width)} x=${Math.round(r.left)}] ` +
        `bg=${cs.backgroundColor}${cs.backgroundImage !== "none" ? " +img" : ""}`,
    );
    for (const c of el.children) walk(c, d + 1);
  };
  walk(document.body, 0);
  return out;
}, depth);

console.log(lines.join("\n"));
await browser.close();
