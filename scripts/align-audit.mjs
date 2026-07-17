/**
 * Alignment audit: measure the live site and the local build at the same
 * viewport and diff their real section boundaries.
 *
 * Diagnoses horizontal alignment from measurements rather than from eyeballing:
 * reports outer gutters per section, container max-width/padding, overflow, and
 * whether the page is centred or offset.
 *
 * Usage:
 *   node scripts/align-audit.mjs 1920
 *   node scripts/align-audit.mjs 1440
 */

import { chromium } from "playwright";

const width = Number(process.argv[2] ?? 1920);
const TARGETS = [
  { name: "LIVE ", url: "https://realestatebrokermatch.com/" },
  { name: "BUILD", url: "http://localhost:3000/" },
];

/** Runs in the page. Finds the real left/right edges of painted content. */
function probe() {
  const vw = window.innerWidth;
  const out = {
    innerWidth: vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    landmarks: [],
    overflowing: [],
  };

  const rect = (el) => el.getBoundingClientRect();

  // Landmark elements whose left edge defines the perceived gutter.
  const marks = [
    ["logo", 'header img, header svg, a[href="/"] img, .site-logo img, img[alt*="Logo" i]'],
    ["nav-first-link", "header nav a, header a"],
    ["h1", "h1"],
    ["hero-p", "h1 ~ * p, h1 + * p, section p"],
    ["h2-first", "h2"],
    ["footer-logo", "footer img, footer svg"],
    ["footer-heading", "footer h2, footer h3, footer .elementor-heading-title"],
  ];

  for (const [name, sel] of marks) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = rect(el);
    if (r.width === 0) continue;
    const cs = getComputedStyle(el);
    out.landmarks.push({
      name,
      tag: el.tagName.toLowerCase(),
      left: Math.round(r.left),
      right: Math.round(vw - r.right),
      width: Math.round(r.width),
      fontSize: cs.fontSize,
    });
  }

  // Any element wider than the viewport = horizontal overflow source.
  for (const el of document.querySelectorAll("body *")) {
    const r = rect(el);
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      out.overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        position: cs.position,
        transform: cs.transform === "none" ? "" : cs.transform.slice(0, 30),
      });
    }
  }
  out.overflowing = out.overflowing.slice(0, 8);
  return out;
}

const browser = await chromium.launch();
const results = {};

for (const t of TARGETS) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  try {
    await page.goto(t.url, { waitUntil: "load", timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    results[t.name] = await page.evaluate(probe);
  } catch (err) {
    console.error(`! ${t.name} ${t.url} → ${err.message}`);
  }
  await page.close();
}
await browser.close();

console.log(`\n════ VIEWPORT ${width}px ════\n`);

for (const [name, r] of Object.entries(results)) {
  const overflow = r.scrollWidth > r.innerWidth;
  console.log(
    `${name}  innerWidth=${r.innerWidth}  scrollWidth=${r.scrollWidth}  ${overflow ? `⚠ OVERFLOW +${r.scrollWidth - r.innerWidth}px` : "no overflow"}`,
  );
}

console.log(`\n${"LANDMARK".padEnd(16)} ${"LIVE left/right".padEnd(20)} ${"BUILD left/right".padEnd(20)} Δleft`);
const live = results["LIVE "];
const build = results["BUILD"];
if (live && build) {
  const names = [...new Set([...live.landmarks.map((l) => l.name), ...build.landmarks.map((l) => l.name)])];
  for (const n of names) {
    const l = live.landmarks.find((x) => x.name === n);
    const b = build.landmarks.find((x) => x.name === n);
    const ls = l ? `${l.left} / ${l.right}` : "—";
    const bs = b ? `${b.left} / ${b.right}` : "—";
    const d = l && b ? b.left - l.left : "";
    const flag = typeof d === "number" && Math.abs(d) > 2 ? "  ←── MISMATCH" : "";
    console.log(`${n.padEnd(16)} ${ls.padEnd(20)} ${bs.padEnd(20)} ${String(d).padStart(5)}${flag}`);
  }
}

for (const [name, r] of Object.entries(results)) {
  if (!r.overflowing.length) continue;
  console.log(`\n${name} OVERFLOWING ELEMENTS:`);
  r.overflowing.forEach((o) =>
    console.log(`  ${o.tag.padEnd(6)} left=${String(o.left).padStart(6)} right=${String(o.right).padStart(6)} w=${String(o.width).padStart(5)} pos=${o.position.padEnd(9)} ${o.transform} ${o.cls}`),
  );
}
