/**
 * Pull exact design values out of Figma via the REST API.
 *
 * The Figma MCP server is capped at 6 tool calls/month on the Starter plan, so
 * the REST API is our source for design values. It is a separate quota and
 * returns more than the MCP did: every fill as exact RGBA, plus fontFamily,
 * fontSize, fontWeight, lineHeight and letterSpacing per text node.
 *
 * Usage:
 *   node scripts/figma-extract.mjs <nodeId> [nodeId...]
 *   node scripts/figma-extract.mjs 95:2            # desktop homepage
 *
 * Writes figma-data/<nodeId>.json (raw) and prints a token summary.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE_KEY = "gde5QfMIOJoT15vDakKzpe";
const OUT_DIR = join(ROOT, "figma-data");

function loadToken() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(
      ".env.local not found. Create it with:\n  echo 'FIGMA_TOKEN=figd_...' > .env.local",
    );
  }
  const match = readFileSync(envPath, "utf8").match(/^FIGMA_TOKEN=(.+)$/m);
  if (!match) throw new Error("FIGMA_TOKEN missing from .env.local");
  return match[1].trim();
}

async function fetchNodes(token, ids) {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${ids.join(",")}`;
  const res = await fetch(url, { headers: { "X-Figma-Token": token } });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Figma stores channels as 0..1 floats. Convert to hex, or rgba() when transparent. */
function toCss(color, opacity = 1) {
  const ch = (v) => Math.round(v * 255);
  const [r, g, b] = [ch(color.r), ch(color.g), ch(color.b)];
  const a = (color.a ?? 1) * opacity;
  if (a >= 0.999) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(4))})`;
}

const colors = new Map(); // css -> Set of "name (id)"
const typography = new Map(); // key -> {style, nodes:Set}

function note(map, key, label) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(label);
}

function walk(node) {
  const label = `${node.name} (${node.id})`;

  for (const fill of node.fills ?? []) {
    if (fill.visible === false) continue;
    if (fill.type === "SOLID" && fill.color) {
      note(colors, toCss(fill.color, fill.opacity ?? 1), label);
    }
  }
  for (const stroke of node.strokes ?? []) {
    if (stroke.visible === false) continue;
    if (stroke.type === "SOLID" && stroke.color) {
      note(colors, `${toCss(stroke.color, stroke.opacity ?? 1)} (stroke)`, label);
    }
  }

  const s = node.style;
  if (s?.fontFamily) {
    const key = [
      s.fontFamily,
      s.fontPostScriptName ?? "",
      `${s.fontWeight}`,
      `${s.fontSize}px`,
      `lh:${s.lineHeightPx ? `${Number(s.lineHeightPx.toFixed(3))}px` : "auto"}`,
      `ls:${s.letterSpacing ? `${Number(s.letterSpacing.toFixed(3))}px` : "0"}`,
      `align:${s.textAlignHorizontal ?? ""}`,
    ].join(" | ");
    if (!typography.has(key)) typography.set(key, new Set());
    typography.get(key).add(label);
  }

  for (const child of node.children ?? []) walk(child);
}

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("Usage: node scripts/figma-extract.mjs <nodeId> [nodeId...]");
  process.exit(1);
}

const token = loadToken();
const data = await fetchNodes(token, ids);

mkdirSync(OUT_DIR, { recursive: true });

for (const id of ids) {
  const entry = data.nodes[id];
  if (!entry) {
    console.error(`! node ${id} not returned — check the id`);
    continue;
  }
  writeFileSync(join(OUT_DIR, `${id.replace(":", "-")}.json`), JSON.stringify(entry, null, 2));
  walk(entry.document);
}

const fmt = (set) => {
  const arr = [...set];
  return arr.length > 4 ? `${arr.slice(0, 4).join(", ")} … +${arr.length - 4} more` : arr.join(", ");
};

console.log(`\n=== COLORS (${colors.size}) ===`);
for (const [css, nodes] of [...colors].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${css.padEnd(26)} ×${String(nodes.size).padEnd(4)} ${fmt(nodes)}`);
}

console.log(`\n=== TYPOGRAPHY (${typography.size}) ===`);
for (const [key, nodes] of [...typography].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`${key}\n   ×${nodes.size}  ${fmt(nodes)}`);
}

console.log(`\nRaw JSON written to figma-data/`);
