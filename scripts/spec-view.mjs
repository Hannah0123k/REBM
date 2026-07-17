/**
 * Pretty-print a y-range slice of live-data/full.json.
 * Usage: node scripts/spec-view.mjs <yStart> <yEnd> [maxDepth] [file]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const yStart = Number(process.argv[2] ?? 0);
const yEnd = Number(process.argv[3] ?? 1e9);
const maxDepth = Number(process.argv[4] ?? 99);
const file = process.argv[5] ?? "full.json";

const { nodes } = JSON.parse(readFileSync(join(ROOT, "live-data", file), "utf8"));

for (const n of nodes) {
  if (n.yEnd < yStart || n.y > yEnd) continue;
  if (n.d > maxDepth) continue;
  const ind = "  ".repeat(Math.max(0, n.d));
  let head = `${ind}${n.tag}${n.id ? "#" + n.id : ""}${n.cls ? "." + n.cls.split(" ").slice(0, 3).join(".") : ""}`;
  head += `  [y ${n.y}→${n.yEnd} h${n.h} x${n.x} w${n.w}]`;
  console.log(head);
  const p = (k, v) => v && console.log(`${ind}   ${k}: ${v}`);
  p("bg", n.bgColor);
  p("bgImage", n.bgImage);
  if (n.bgImage) p("bgSize/pos", `${n.bgSize} / ${n.bgPosition} / ${n.bgRepeat}`);
  p("padding", n.padding);
  p("margin", n.margin);
  p("maxWidth", n.maxWidth);
  p("gap", n.gap);
  p("flex", n.flex);
  p("grid", n.grid);
  p("border", n.border);
  p("radius", n.radius);
  p("shadow", n.shadow);
  p("opacity", n.opacity);
  p("transform", n.transform);
  p("href", n.href);
  if (n.font)
    console.log(
      `${ind}   FONT ${n.font.size}/${n.font.lineHeight} w${n.font.weight} ${n.font.color} ls=${n.font.letterSpacing} align=${n.font.align} ${n.font.family.split(",")[0]}${n.font.transform !== "none" ? " tt=" + n.font.transform : ""}${n.font.decoration !== "none" ? " td=" + n.font.decoration : ""}`,
    );
  if (n.text) console.log(`${ind}   TEXT "${n.text}"`);
  if (n.img)
    console.log(
      `${ind}   IMG nat=${n.img.natural} rend=${n.img.rendered} fit=${n.img.objectFit} pos=${n.img.objectPosition} alt="${n.img.alt}"\n${ind}       src=${n.img.src}`,
    );
}
