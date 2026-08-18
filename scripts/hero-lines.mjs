/**
 * Cross-browser guard for the hero headline's three designed desktop lines.
 *
 *   node scripts/hero-lines.mjs                          # against localhost:3000
 *   TARGET=https://realestatebrokermatch.com node scripts/hero-lines.mjs
 *   ENGINES=chromium,firefox,webkit node scripts/hero-lines.mjs
 *
 * WHY THIS EXISTS
 * The desktop hero must read exactly:
 *     Real Estate Broker Match will
 *     match you with a real estate broker
 *     who will sell your property.
 * It once fitted by ONE PIXEL — line 2 needed 839.0px inside an 840px
 * max-width — so a machine whose text measured a hair wider stranded "broker"
 * on a fourth line. With Inter unavailable the same line needs 865.6px, which
 * reproduced the failure exactly. The fix gives each line its own nowrap block
 * and hands the width back to the Container; this script proves the margin
 * stays large, including with web fonts blocked.
 *
 * It asserts the LINE CONTENTS, not the line count — three lines split in the
 * wrong places would pass a count check.
 *
 * NOTE ON WEBKIT: Playwright's bundled WebKit cannot fetch subresources from
 * http://localhost on some machines ("An SSL error has occurred"), which leaves
 * the page unstyled and every measurement meaningless. Run WebKit against the
 * deployed HTTPS TARGET instead; the script skips it for http:// targets.
 */
import { chromium, firefox, webkit } from "playwright";

const TARGET = process.env.TARGET ?? "http://localhost:3000/";
const WANT = [
  "Real Estate Broker Match will",
  "match you with a real estate broker",
  "who will sell your property.",
];
const DESKTOP = [1024, 1100, 1280, 1366, 1440, 1512, 1536, 1600, 1920, 2560];
const MOBILE = [320, 375, 390, 430, 768, 1023];
/** Below this the copy is meant to wrap freely, so nowrap must NOT be applied. */
const LG = 1024;

const ALL = { chromium, firefox, webkit };
const picked = (process.env.ENGINES ?? "chromium,firefox")
  .split(",")
  .map((s) => s.trim())
  .filter((n) => ALL[n] && (n !== "webkit" || TARGET.startsWith("https://")));

/** Split the h1 into visual lines, and measure what line 2 actually needs. */
function probe(line2) {
  const h1 = document.querySelector("h1");
  const cs = getComputedStyle(h1);

  const s = document.createElement("span");
  s.textContent = line2;
  s.style.cssText =
    `position:absolute;left:-99999px;white-space:nowrap;font-family:${cs.fontFamily};` +
    `font-size:${cs.fontSize};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};`;
  document.body.appendChild(s);
  const need = s.getBoundingClientRect().width;
  s.remove();

  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  const byTop = new Map();
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent;
    if (!t.trim()) continue;
    const r = document.createRange();
    for (let i = 0; i < t.length; i++) {
      r.setStart(n, i);
      r.setEnd(n, i + 1);
      const b = r.getBoundingClientRect();
      if (!b.height) continue;
      const k = Math.round(b.top);
      byTop.set(k, (byTop.get(k) ?? "") + t[i]);
    }
  }
  const lines = [...byTop.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.trim());
  const firstSpan = h1.querySelector(":scope > span");

  return {
    need,
    box: h1.getBoundingClientRect().width,
    lines,
    whiteSpace: firstSpan ? getComputedStyle(firstSpan).whiteSpace : "",
    fontSize: cs.fontSize,
    interLoaded: document.fonts.check("600 50px Inter"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    rightEdge: h1.getBoundingClientRect().right,
    clientW: document.documentElement.clientWidth,
  };
}

async function measure(engine, width, { blockFonts = false, dpr = 1, rootFs } = {}) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: dpr });
    if (blockFonts) await page.route(/\.(woff2?|ttf|otf)(\?.*)?$/i, (r) => r.abort());
    await page.goto(TARGET, { waitUntil: "networkidle" });
    if (rootFs) await page.addStyleTag({ content: `html{font-size:${rootFs}px}` });
    await page.evaluate(() => document.fonts.ready.catch(() => {}));
    await page.waitForTimeout(300);
    return await page.evaluate(probe, WANT[1]);
  } finally {
    await browser.close();
  }
}

let failures = 0;
let minMargin = Infinity;

console.log(`hero line guard → ${TARGET}`);
console.log(`engines: ${picked.join(", ") || "(none)"}\n`);
console.log("engine    vw     scenario         need     box   MARGIN  result");
console.log("─".repeat(72));

for (const name of picked) {
  const engine = ALL[name];
  const cases = [
    ...DESKTOP.map((w) => [w, "Inter loaded", {}]),
    ...[1024, 1280, 1440, 1920].map((w) => [w, "Inter BLOCKED", { blockFonts: true }]),
    ...[1.25, 1.5, 2].map((d) => [1440, `DPR ${d}`, { dpr: d }]),
    ...[18, 20].map((f) => [1440, `root ${f}px`, { rootFs: f }]),
  ];
  for (const [w, label, opts] of cases) {
    const d = await measure(engine, w, opts);
    const ok = d.lines.length === WANT.length && WANT.every((x, i) => d.lines[i] === x);
    const margin = d.box - d.need;
    minMargin = Math.min(minMargin, margin);
    if (!ok || d.overflow > 0) failures++;
    console.log(
      `${name.padEnd(9)} ${String(w).padStart(5)}  ${label.padEnd(15)} ${d.need.toFixed(1).padStart(7)} ` +
        `${d.box.toFixed(0).padStart(7)} ${margin.toFixed(1).padStart(8)}  ${ok ? "✓" : "✗ " + JSON.stringify(d.lines)}`,
    );
  }
}

console.log("\nmobile / tablet — must wrap freely, never nowrap, never overflow");
for (const name of picked) {
  for (const w of MOBILE) {
    const d = await measure(ALL[name], w);
    const ok = d.whiteSpace !== "nowrap" && d.overflow <= 0 && d.rightEdge <= d.clientW + 1;
    if (!ok) failures++;
    console.log(
      `${name.padEnd(9)} ${String(w).padStart(5)}  white-space:${d.whiteSpace.padEnd(8)} ` +
        `font ${d.fontSize.padStart(5)}  overflow ${String(d.overflow).padStart(3)}  ${ok ? "✓" : "✗"}`,
    );
  }
}

console.log("─".repeat(72));
console.log(`smallest safety margin: ${minMargin.toFixed(1)}px`);
console.log(failures === 0 ? "PASS" : `FAIL — ${failures} case(s)`);
process.exit(failures === 0 ? 0 : 1);
