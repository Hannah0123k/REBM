/**
 * Full computed-style dump of a subtree of the live homepage.
 * Emits every rendered element with geometry + the computed properties that
 * matter for a 1:1 rebuild. Live site is the design authority (CLAUDE.md).
 *
 * Usage: node scripts/spec-dump.mjs <selector> <outfile> [depth] [url]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "live-data");
const sel = process.argv[2] ?? ".entry-content";
const outfile = process.argv[3] ?? "dump.json";
const maxDepth = Number(process.argv[4] ?? 99);
const url = process.argv[5] ?? "https://realestatebrokermatch.com/";

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
await page.waitForTimeout(2500);
// un-lazy everything and wait for every <img> to actually decode, so naturalWidth is real
await page.evaluate(async () => {
  for (const img of document.querySelectorAll("img")) {
    img.loading = "eager";
    if (img.dataset.src && !img.src) img.src = img.dataset.src;
  }
  await Promise.all(
    [...document.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : img.decode().catch(() => {}),
    ),
  );
});
await page.waitForTimeout(1500);
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(800);

const data = await page.evaluate(
  ({ sel, maxDepth }) => {
    const nodes = [];
    const walk = (el, d) => {
      if (d > maxDepth) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      if (r.height < 1 && r.width < 1) return;

      const ownText = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

      const n = {
        d,
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        cls: (el.className || "").toString().trim().split(/\s+/).slice(0, 5).join(" ") || undefined,
        y: Math.round(r.top + scrollY),
        yEnd: Math.round(r.bottom + scrollY),
        x: Math.round(r.left),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        pos: cs.position !== "static" ? cs.position : undefined,
        display: cs.display,
        text: ownText || undefined,
      };

      // box
      const pad = `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`;
      if (pad !== "0px 0px 0px 0px") n.padding = pad;
      const mar = `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`;
      if (mar !== "0px 0px 0px 0px") n.margin = mar;
      if (cs.maxWidth !== "none") n.maxWidth = cs.maxWidth;
      if (cs.gap && cs.gap !== "normal") n.gap = cs.gap;
      if (cs.display.includes("flex")) {
        n.flex = `${cs.flexDirection} justify:${cs.justifyContent} align:${cs.alignItems} wrap:${cs.flexWrap}`;
      }
      if (cs.display.includes("grid")) {
        n.grid = `cols:${cs.gridTemplateColumns} rows:${cs.gridTemplateRows}`;
      }

      // paint
      if (cs.backgroundColor !== "rgba(0, 0, 0, 0)") n.bgColor = cs.backgroundColor;
      if (cs.backgroundImage !== "none") {
        n.bgImage = cs.backgroundImage;
        n.bgSize = cs.backgroundSize;
        n.bgPosition = cs.backgroundPosition;
        n.bgRepeat = cs.backgroundRepeat;
      }
      if (cs.borderTopWidth !== "0px" || cs.borderBottomWidth !== "0px" || cs.borderLeftWidth !== "0px" || cs.borderRightWidth !== "0px") {
        n.border = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor} | R ${cs.borderRightWidth} | B ${cs.borderBottomWidth} ${cs.borderBottomColor} | L ${cs.borderLeftWidth}`;
      }
      if (cs.borderRadius !== "0px") n.radius = cs.borderRadius;
      if (cs.boxShadow !== "none") n.shadow = cs.boxShadow;
      if (cs.opacity !== "1") n.opacity = cs.opacity;
      if (cs.transform !== "none") n.transform = cs.transform;
      if (cs.overflow !== "visible") n.overflow = cs.overflow;

      // type (only when it owns text, or is a leaf-ish inline)
      if (ownText) {
        n.font = {
          family: cs.fontFamily,
          size: cs.fontSize,
          weight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          align: cs.textAlign,
          transform: cs.textTransform,
          style: cs.fontStyle,
          decoration: cs.textDecorationLine,
        };
      }

      if (el.tagName === "IMG") {
        n.img = {
          src: el.currentSrc || el.src,
          srcset: (el.getAttribute("srcset") || "").slice(0, 200) || undefined,
          natural: `${el.naturalWidth}x${el.naturalHeight}`,
          rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
          objectFit: cs.objectFit,
          objectPosition: cs.objectPosition,
          alt: el.alt ?? "",
          loading: el.getAttribute("loading") ?? undefined,
        };
      }
      if (el.tagName === "A") {
        n.href = el.getAttribute("href");
      }
      if (el.tagName === "svg" || el.tagName === "SVG") n.isSvg = true;

      nodes.push(n);
      for (const c of el.children) walk(c, d + 1);
    };
    for (const root of document.querySelectorAll(sel)) walk(root, 0);
    return { nodes, pageHeight: document.body.scrollHeight };
  },
  { sel, maxDepth },
);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, outfile), JSON.stringify(data, null, 2));
console.log(`${data.nodes.length} nodes → live-data/${outfile}  (pageHeight ${data.pageHeight})`);
await browser.close();
