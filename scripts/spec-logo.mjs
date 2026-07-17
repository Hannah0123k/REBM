/**
 * Render the live logo SVG to PNG at 3x on both light and dark backdrops,
 * and report any CSS filter/opacity applied to it in the header + footer.
 */
import { chromium } from "playwright";

const SCRATCH =
  "/private/tmp/claude-501/-Users-hannahkatsenelson/bb70d643-6ede-4e13-8e94-40d23647f4d6/scratchpad";
const logo = process.argv[2] ?? `${SCRATCH}/rebm-logo.svg`;

const browser = await chromium.launch();

// 1. render the raw asset big, on white and on the hero blue
const page = await browser.newPage({ viewport: { width: 1400, height: 500 } });
await page.setContent(`
  <body style="margin:0">
    <div style="background:#fff;padding:30px"><img src="file://${logo}" width="1374"></div>
    <div style="background:#689ECF;padding:30px"><img src="file://${logo}" width="1374"></div>
  </body>`);
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCRATCH}/logo-render-3x.png`, fullPage: true });

// 2. what the live page actually does to it
const live = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await live.goto("https://realestatebrokermatch.com/", { waitUntil: "networkidle", timeout: 90000 });
await live.evaluate(() => document.fonts.ready);
await live.evaluate(async () => {
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => {
      scrollTo(0, y);
      y += 900;
      if (y > document.body.scrollHeight) { clearInterval(t); scrollTo(0, 0); r(); }
    }, 30);
  });
});
await live.waitForTimeout(2000);
await live.evaluate(() => scrollTo(0, 0));
await live.waitForTimeout(600);

const info = await live.evaluate(() => {
  const out = [];
  for (const img of document.querySelectorAll("img")) {
    const src = img.currentSrc || img.src;
    if (!/logo/i.test(src)) continue;
    const cs = getComputedStyle(img);
    const r = img.getBoundingClientRect();
    out.push({
      src,
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
      rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
      y: Math.round(r.top + scrollY),
      x: Math.round(r.left),
      filter: cs.filter,
      opacity: cs.opacity,
      objectFit: cs.objectFit,
      mixBlend: cs.mixBlendMode,
      alt: img.alt,
      parentBg: getComputedStyle(img.closest("div,a") ?? img).backgroundColor,
    });
  }
  return out;
});
console.log(JSON.stringify(info, null, 2));

// 3. crop the header logo area and the footer logo area
await live.screenshot({ path: `${SCRATCH}/logo-header-live.png`, clip: { x: 160, y: 20, width: 540, height: 95 } });
await browser.close();
console.log(`\nwrote logo-render-3x.png + logo-header-live.png to scratchpad`);
