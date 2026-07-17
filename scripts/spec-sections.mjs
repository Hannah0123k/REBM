/**
 * Dump the top-level section structure of the live homepage in document order,
 * with y-ranges, backgrounds, and container geometry.
 *
 * Live site is the design authority (see CLAUDE.md pivot). Read-only.
 *
 * Usage: node scripts/spec-sections.mjs [url]
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
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
// force lazy images in
await page.evaluate(async () => {
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => {
      window.scrollTo(0, y);
      y += 600;
      if (y > document.body.scrollHeight) {
        clearInterval(t);
        window.scrollTo(0, 0);
        r();
      }
    }, 40);
  });
});
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const report = await page.evaluate(() => {
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top + window.scrollY),
      bottom: Math.round(r.bottom + window.scrollY),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };

  const out = { pageHeight: document.body.scrollHeight, sections: [] };

  // Elementor top-level sections
  const tops = document.querySelectorAll(
    "body > div > section, body > div > div > section, .elementor-section.elementor-top-section, header, footer",
  );

  const seen = new Set();
  for (const el of tops) {
    const g = abs(el);
    if (g.height < 20) continue;
    const key = `${g.top}-${g.height}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cs = getComputedStyle(el);

    // find the inner content container (elementor-container / .e-con-inner)
    const inner = el.querySelector(
      ".elementor-container, .e-con-inner, .elementor-widget-wrap",
    );
    const ig = inner ? abs(inner) : null;
    const ics = inner ? getComputedStyle(inner) : null;

    out.sections.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      cls: (el.className || "").toString().slice(0, 120),
      geom: g,
      bg: {
        color: cs.backgroundColor,
        image: cs.backgroundImage === "none" ? null : cs.backgroundImage,
        size: cs.backgroundSize,
        position: cs.backgroundPosition,
        repeat: cs.backgroundRepeat,
        attachment: cs.backgroundAttachment,
      },
      pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
      container: ig
        ? {
            width: ig.width,
            left: ig.left,
            maxWidth: ics.maxWidth,
            pad: `${ics.paddingTop} ${ics.paddingRight} ${ics.paddingBottom} ${ics.paddingLeft}`,
            display: ics.display,
            gap: ics.gap,
          }
        : null,
      headings: [...el.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .slice(0, 8)
        .map((h) => `${h.tagName}: ${h.textContent.trim().slice(0, 90)}`),
      text: el.innerText.trim().slice(0, 160).replace(/\s+/g, " "),
    });
  }
  out.sections.sort((a, b) => a.geom.top - b.geom.top);
  return out;
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "sections.json"), JSON.stringify(report, null, 2));

console.log(`page height: ${report.pageHeight}`);
console.log(`sections: ${report.sections.length}\n`);
for (const s of report.sections) {
  console.log(
    `y ${String(s.geom.top).padStart(5)}→${String(s.geom.bottom).padStart(5)} h=${String(s.geom.height).padStart(4)} ${s.tag}#${s.id ?? "-"}`,
  );
  console.log(`   bg ${s.bg.color}  img=${s.bg.image ? s.bg.image.slice(0, 90) : "none"}`);
  console.log(`   pad ${s.pad}`);
  if (s.container)
    console.log(
      `   container w=${s.container.width} left=${s.container.left} max=${s.container.maxWidth} pad=${s.container.pad}`,
    );
  if (s.headings.length) s.headings.forEach((h) => console.log(`   ${h}`));
  console.log(`   "${s.text.slice(0, 100)}"`);
  console.log();
}
await browser.close();
