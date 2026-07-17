import type { TiptapDoc } from "@/lib/blog/types";

/** Collect all text out of a TipTap JSON doc (no editor instance needed). */
export function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  let out = "";
  if (typeof n.text === "string") out += n.text + " ";
  if (Array.isArray(n.content)) {
    for (const child of n.content) out += extractText(child);
  }
  return out;
}

/** Word-count → reading time at 200 wpm, minimum 1 minute for non-empty posts. */
export function readingTimeMinutes(doc: TiptapDoc | null | undefined): number {
  if (!doc) return 0;
  const words = extractText(doc).trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

/** True when the doc has no visible text (used to skip autosaving an empty new post). */
export function isEmptyDoc(doc: TiptapDoc | null | undefined): boolean {
  return !doc || extractText(doc).trim().length === 0;
}
