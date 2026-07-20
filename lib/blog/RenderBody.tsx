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

/** colspan/rowspan as DOM attrs (omit when 1 to keep markup clean). */
function cellSpans(node: Node): { colSpan?: number; rowSpan?: number } {
  const c = Number(node.attrs?.colspan) || 1;
  const r = Number(node.attrs?.rowspan) || 1;
  return { colSpan: c > 1 ? c : undefined, rowSpan: r > 1 ? r : undefined };
}

/** Unwrap a lone paragraph inside a cell so cells don't carry block margins. */
function cellContent(node: Node): ReactNode {
  const content = node.content ?? [];
  if (content.length === 1 && content[0].type === "paragraph") {
    return renderChildren(content[0].content);
  }
  return renderChildren(content);
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
    case "table":
      // Wrapper scrolls horizontally on small screens instead of overflowing.
      return (
        <div key={key} className="my-[20px] w-full overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
            <tbody>{renderChildren(node.content)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{renderChildren(node.content)}</tr>;
    case "tableHeader": {
      const { colSpan, rowSpan } = cellSpans(node);
      return (
        <th
          key={key}
          scope="col"
          colSpan={colSpan}
          rowSpan={rowSpan}
          className="border border-rebm-card-border bg-[#EEF3F8] px-[12px] py-[8px] text-left align-top font-semibold text-rebm-navy"
        >
          {cellContent(node)}
        </th>
      );
    }
    case "tableCell": {
      const { colSpan, rowSpan } = cellSpans(node);
      return (
        <td
          key={key}
          colSpan={colSpan}
          rowSpan={rowSpan}
          className="border border-rebm-card-border px-[12px] py-[8px] align-top"
        >
          {cellContent(node)}
        </td>
      );
    }
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
