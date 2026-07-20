import { Fragment, type ReactNode } from "react";

import type { TiptapDoc } from "@/lib/blog/types";

/**
 * Render a STORED (already sanitized) TipTap document to React nodes.
 * =========================================================================
 * The body is sanitized to a fixed allowlist on save (lib/blog/sanitize.ts:
 * safe href schemes only, no scripts/iframes/styles/handlers), so rendering is
 * trusted. We still render through React (which escapes all text) rather than
 * dangerouslySetInnerHTML, and we re-validate hrefs/levels here — belt and
 * suspenders. No @tiptap/html dependency needed; this walks the known node set.
 */

type Mark = { type?: string; attrs?: Record<string, unknown> };
type Node = {
  type?: string;
  content?: Node[];
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  text?: string;
};

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

function withMarks(text: string, marks: Mark[] | undefined, key: number): ReactNode {
  if (!marks?.length) return <Fragment key={key}>{text}</Fragment>;
  return marks.reduce<ReactNode>((child, mark, i) => {
    switch (mark.type) {
      case "bold":
        return <strong key={i}>{child}</strong>;
      case "italic":
        return <em key={i}>{child}</em>;
      case "strike":
        return <s key={i}>{child}</s>;
      case "code":
        return <code key={i}>{child}</code>;
      case "link": {
        const href = String(mark.attrs?.href ?? "");
        if (!SAFE_HREF.test(href)) return child; // unsafe → drop the link, keep text
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer noopener">
            {child}
          </a>
        );
      }
      default:
        return child;
    }
  }, <Fragment key={key}>{text}</Fragment>);
}

function renderChildren(nodes: Node[] | undefined): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((n, i) => renderNode(n, i));
}

function renderNode(node: Node, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return withMarks(node.text ?? "", node.marks, key);
    case "paragraph":
      return <p key={key}>{renderChildren(node.content)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level);
      const children = renderChildren(node.content);
      if (level === 3) return <h3 key={key}>{children}</h3>;
      if (level === 4) return <h4 key={key}>{children}</h4>;
      return <h2 key={key}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node.content)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node.content)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderChildren(node.content)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!SAFE_HREF.test(src)) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} loading="lazy" />;
    }
    default:
      return null;
  }
}

/** Returns true when the document has no rendered content. */
export function isBodyEmpty(doc: TiptapDoc | null | undefined): boolean {
  const content = (doc as Node | undefined)?.content;
  if (!content?.length) return true;
  return content.every(
    (n) => (!n.content || n.content.length === 0) && !n.text && n.type !== "horizontalRule" && n.type !== "image",
  );
}

export function RenderBody({ doc }: { doc: TiptapDoc }) {
  return <>{renderChildren((doc as Node).content)}</>;
}
