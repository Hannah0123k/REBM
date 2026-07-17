/**
 * Full-page screenshot + per-section crops of the live homepage, and a probe of
 * ::before/::after background images that getComputedStyle on elements misses.
 */
import { chromium } from "playwright";

const SCRATCH =
  "/private/tmp/claude-501/-Users-hannahkatsenelson/bb70d643-6ede-4e13-8e94-40d23647f4d6/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  for (const img of document.querySelectorAll("img")) img.loading = "eager";
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => {
      scrollTo(0, y);
      y += 700;
      if (y > document.body.scrollHeight) { clearInterval(t); scrollTo(0, 0); r(); }
    }, 30);
  });
  await Promise.all([...document.querySelectorAll("img")].map((i) => (i.complete ? 0 : i.decode().catch(() => {}))));
});
await page.waitForTimeout(2000);
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(600);

// pseudo-element bg probe on candidate sections
const pseudo = await page.evaluate(() => {
  const ids = ["process", "about", "property", "testamonial", "faq"];
  const out = [];
  for (const id of ["#process", "#about", "#property", "#testamonial", "#faq", ".elementor-element-cbe1923", ".elementor-element-0ea4f0b"]) {
    const el = document.querySelector(id);
    if (!el) continue;
    for (const p of ["::before", "::after"]) {
      const cs = getComputedStyle(el, p);
      if (cs.backgroundImage !== "none" || (cs.content !== "none" && cs.content !== "normal" && cs.width !== "auto")) {
        out.push(`${id}${p}: content=${cs.content} bgImage=${cs.backgroundImage} bg=${cs.backgroundColor} size=${cs.backgroundSize} pos=${cs.backgroundPosition} w=${cs.width} h=${cs.height}`);
      }
    }
  }
  return out;
});
console.log("PSEUDO BG:\n" + (pseudo.join("\n") || "  none found"));

const ranges = [
  ["01-hero", 0, 982],
  ["02-about", 982, 2080],
  ["03-process", 2080, 2927],
  ["04-google", 2927, 3394],
  ["05-introduce", 3394, 4116],
  ["06-markets", 4116, 5797],
  ["07-cta", 5797, 6206],
  ["08a-testimonials", 6206, 8280],
  ["08b-faq", 8280, 9017],
  ["09-footer", 9017, 9453],
];
for (const [name, y0, y1] of ranges) {
  await page.screenshot({ path: `${SCRATCH}/sec-${name}.png`, clip: { x: 0, y: y0, width: 1920, height: Math.min(y1 - y0, 2200) } });
}
await browser.close();
console.log("wrote sec-*.png");
