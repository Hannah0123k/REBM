/**
 * Unit tests for the blog's critical PURE logic — no DB, no browser.
 * Run: `npm test` (Node's built-in runner, native TS type-stripping).
 *
 * These lock down the guarantees that keep migrated posts correct: slug format,
 * body sanitization (security), and zone-stable date handling.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatPublishedDate, isoDateTimeAttr } from "../lib/blog/date.ts";
import { extractText, readingTimeMinutes } from "../lib/blog/readingTime.ts";
import { sanitizeDoc } from "../lib/blog/sanitize.ts";
import { isValidSlug, slugify } from "../lib/blog/slug.ts";

// ── slugify ──────────────────────────────────────────────────────────────────
test("slugify normalizes to the DB slug format", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("  Trim  Me  "), "trim-me");
  assert.equal(slugify("Multiple   spaces & symbols!!"), "multiple-spaces-symbols");
  assert.equal(slugify("Café Déjà Vu"), "cafe-deja-vu");
  assert.equal(slugify("--leading-and-trailing--"), "leading-and-trailing");
  assert.equal(slugify("2019 Market Report"), "2019-market-report");
});

test("isValidSlug matches the DB constraint", () => {
  for (const s of ["a", "hello-world", "post-2", "2019-report"]) assert.ok(isValidSlug(s), s);
  for (const s of ["Hello", "trailing-", "-leading", "double--hyphen", "has space", ""]) {
    assert.ok(!isValidSlug(s), s);
  }
});

test("slugify output always passes isValidSlug (round-trip)", () => {
  for (const t of ["A Título!", "  x  ", "Rates & Deal-Flow, 2026", "多 language mix"]) {
    const s = slugify(t);
    if (s) assert.ok(isValidSlug(s), `${t} -> ${s}`);
  }
});

// ── sanitizeDoc (security) ───────────────────────────────────────────────────
test("sanitizeDoc strips disallowed nodes and marks", () => {
  const dirty = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "ok", marks: [{ type: "bold" }, { type: "evil" }] }] },
      { type: "script", content: [{ type: "text", text: "alert(1)" }] },
    ],
  };
  const clean = sanitizeDoc(dirty);
  assert.equal(clean.content?.length, 1); // <script> node dropped
  const para = clean.content![0] as { content: { marks?: { type: string }[] }[] };
  assert.deepEqual(para.content[0].marks?.map((m) => m.type), ["bold"]); // "evil" dropped
});

test("sanitizeDoc rejects unsafe link/image URLs", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] },
      { type: "image", attrs: { src: "javascript:alert(1)" } },
    ],
  };
  const clean = sanitizeDoc(doc);
  const para = clean.content![0] as { content: { marks?: unknown[] }[] };
  assert.equal(para.content[0].marks, undefined); // unsafe link stripped
  assert.equal(clean.content!.length, 1); // unsafe image dropped
});

test("sanitizeDoc clamps heading level and keeps safe content", () => {
  const clean = sanitizeDoc({
    type: "doc",
    content: [{ type: "heading", attrs: { level: 9 }, content: [{ type: "text", text: "Title" }] }],
  });
  const h = clean.content![0] as { attrs: { level: number } };
  assert.equal(h.attrs.level, 2); // out-of-range level clamped to 2
});

test("sanitizeDoc throws when the root is not a doc", () => {
  assert.throws(() => sanitizeDoc({ type: "paragraph" }));
  assert.throws(() => sanitizeDoc(null));
});

// ── date handling (zone stability) ───────────────────────────────────────────
test("formatPublishedDate keeps date-only strings on their calendar day", () => {
  assert.equal(formatPublishedDate("2026-02-03"), "February 3, 2026");
  assert.equal(formatPublishedDate("2019-07-15"), "July 15, 2019");
});

test("formatPublishedDate renders instants in the fixed business zone (ET)", () => {
  // 02:00 UTC on Feb 3 is still Feb 2 in New York (UTC-5) — must NOT show Feb 3.
  assert.equal(formatPublishedDate("2026-02-03T02:00:00Z"), "February 2, 2026");
  // 20:00 UTC on Feb 3 is Feb 3 afternoon in New York.
  assert.equal(formatPublishedDate("2026-02-03T20:00:00Z"), "February 3, 2026");
});

test("isoDateTimeAttr returns a full UTC instant", () => {
  assert.equal(isoDateTimeAttr("2026-02-03"), "2026-02-03T12:00:00.000Z");
  assert.equal(isoDateTimeAttr("2026-02-03T20:00:00Z"), "2026-02-03T20:00:00.000Z");
  assert.equal(isoDateTimeAttr("not-a-date"), "");
});

// ── reading time ─────────────────────────────────────────────────────────────
test("extractText pulls all text from a Tiptap doc", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "one two" }] },
      { type: "paragraph", content: [{ type: "text", text: "three" }] },
    ],
  };
  assert.equal(extractText(doc).trim(), "one two three");
});

test("readingTimeMinutes is >=1 for non-empty and 0 for empty", () => {
  const words = Array.from({ length: 450 }, (_, i) => `w${i}`).join(" ");
  const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: words }] }] };
  assert.ok(readingTimeMinutes(doc) >= 2); // 450 words @200wpm ≈ 3
  assert.equal(readingTimeMinutes({ type: "doc", content: [] }), 0);
});
