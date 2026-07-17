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
]);

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
      out.attrs = { level: level >= 2 && level <= 4 ? level : 2 };
    } else if (node.type === "image") {
      const src = String(node.attrs.src ?? "");
      if (!SAFE_HREF.test(src)) return null; // drop unsafe image sources
      out.attrs = {
        src,
        alt: typeof node.attrs.alt === "string" ? node.attrs.alt : null,
        title: typeof node.attrs.title === "string" ? node.attrs.title : null,
      };
    }
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
