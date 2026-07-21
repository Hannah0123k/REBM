import type { TiptapDoc } from "@/lib/blog/types";

/**
 * Server-side allowlist for the stored TipTap document. The client editor only
 * produces these node/mark types, but a request can POST arbitrary JSON — so we
 * strip anything not on the list before saving. No scripts, iframes, styles,
 * or event handlers can exist in this structure, and link hrefs are restricted
 * to safe schemes. Pure JSON traversal — no browser/editor dependency.
 */
const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "image",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
]);

/** Coerce a table cell span to a safe positive integer (default 1). */
function safeSpan(v: unknown): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 1000 ? n : 1;
}

/** Keep only a clean numeric colwidth array, or null. */
function safeColwidth(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((n) => Math.floor(Number(n))).filter((n) => Number.isFinite(n) && n > 0 && n <= 5000);
  return out.length ? out : null;
}

/**
 * Text alignment on a paragraph/heading. Only "center"/"right" are stored;
 * "left" (and anything unexpected) collapses to null, since left is the default
 * and rendering nothing keeps the document clean. Kept in lock-step with the
 * editor's TextAlign config and the public renderer.
 */
function safeAlign(v: unknown): "center" | "right" | null {
  return v === "center" || v === "right" ? v : null;
}

const ALLOWED_MARKS = new Set(["bold", "italic", "strike", "code", "link"]);

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

type Node = {
  type?: string;
  content?: Node[];
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
  text?: string;
};

function cleanNode(node: Node): Node | null {
  if (!node || typeof node !== "object" || !node.type || !ALLOWED_NODES.has(node.type)) {
    return null;
  }

  const out: Node = { type: node.type };

  if (typeof node.text === "string") out.text = node.text;

  // Whitelist attrs per node type (drop anything unexpected).
  if (node.attrs) {
    if (node.type === "heading") {
      const level = Number(node.attrs.level);
      out.attrs = { level: level >= 2 && level <= 4 ? level : 2, textAlign: safeAlign(node.attrs.textAlign) };
    } else if (node.type === "paragraph") {
      out.attrs = { textAlign: safeAlign(node.attrs.textAlign) };
    } else if (node.type === "image") {
      const src = String(node.attrs.src ?? "");
      if (!SAFE_HREF.test(src)) return null; // drop unsafe image sources
      out.attrs = {
        src,
        alt: typeof node.attrs.alt === "string" ? node.attrs.alt : null,
        title: typeof node.attrs.title === "string" ? node.attrs.title : null,
      };
    } else if (node.type === "tableCell" || node.type === "tableHeader") {
      // Whitelist only the structural span/width attrs — never styles/classes.
      out.attrs = {
        colspan: safeSpan(node.attrs.colspan),
        rowspan: safeSpan(node.attrs.rowspan),
        colwidth: safeColwidth(node.attrs.colwidth),
      };
    }
  } else if (node.type === "tableCell" || node.type === "tableHeader") {
    out.attrs = { colspan: 1, rowspan: 1, colwidth: null };
  }

  if (Array.isArray(node.marks)) {
    const marks = node.marks
      .filter((m) => m.type && ALLOWED_MARKS.has(m.type))
      .map((m) => {
        if (m.type === "link") {
          const href = String(m.attrs?.href ?? "");
          if (!SAFE_HREF.test(href)) return null;
          return { type: "link", attrs: { href, target: "_blank", rel: "noreferrer noopener" } };
        }
        return { type: m.type };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    if (marks.length) out.marks = marks as Node["marks"];
  }

  if (Array.isArray(node.content)) {
    const content = node.content
      .map(cleanNode)
      .filter((n): n is Node => n !== null);
    out.content = content;
  }

  // Table integrity: keep the structure valid so malformed source can't break
  // the editor/renderer. A cell must hold at least one block; a row must hold
  // cells; a table must hold rows (else drop it).
  if (out.type === "tableCell" || out.type === "tableHeader") {
    if (!out.content || out.content.length === 0) out.content = [{ type: "paragraph" }];
  } else if (out.type === "tableRow") {
    out.content = (out.content ?? []).filter(
      (c) => c.type === "tableCell" || c.type === "tableHeader",
    );
    if (out.content.length === 0) return null;
  } else if (out.type === "table") {
    out.content = (out.content ?? []).filter((c) => c.type === "tableRow");
    if (out.content.length === 0) return null;
  }

  return out;
}

/** Sanitize a document to the allowlist. Throws if it isn't a doc node. */
export function sanitizeDoc(input: unknown): TiptapDoc {
  const cleaned = cleanNode(input as Node);
  if (!cleaned || cleaned.type !== "doc") {
    throw new Error("Invalid document content.");
  }
  return cleaned as TiptapDoc;
}
