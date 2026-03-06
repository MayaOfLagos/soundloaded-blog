import type { JSONContent } from "@tiptap/react";

/**
 * Detect if body JSON is in Lexical format (has `root` key).
 */
export function isLexicalFormat(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  return "root" in (body as Record<string, unknown>);
}

/**
 * Convert Lexical JSON to Tiptap-compatible ProseMirror JSON.
 */
export function convertLexicalToTiptap(lexical: unknown): JSONContent | null {
  if (!lexical || typeof lexical !== "object") return null;
  const node = lexical as Record<string, unknown>;

  // Unwrap root
  if (node.root) {
    return convertLexicalToTiptap(node.root);
  }

  const children = Array.isArray(node.children)
    ? ((node.children as unknown[]).map(convertLexicalNode).filter(Boolean) as JSONContent[])
    : [];

  if (node.type === "root") {
    return { type: "doc", content: children.length ? children : [{ type: "paragraph" }] };
  }

  return { type: "doc", content: children.length ? children : [{ type: "paragraph" }] };
}

function convertLexicalNode(node: unknown): JSONContent | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;

  const children = Array.isArray(n.children)
    ? ((n.children as unknown[]).map(convertLexicalNode).filter(Boolean) as JSONContent[])
    : undefined;

  switch (n.type) {
    case "paragraph":
      return { type: "paragraph", content: children?.length ? children : undefined };

    case "heading": {
      const tag = String(n.tag ?? "h2");
      const level = parseInt(tag.replace("h", ""), 10) || 2;
      return {
        type: "heading",
        attrs: { level },
        content: children?.length ? children : undefined,
      };
    }

    case "text": {
      const text = String(n.text ?? "");
      if (!text) return null;
      const marks: { type: string; attrs?: Record<string, unknown> }[] = [];
      const format = (n.format as number) || 0;
      if (format & 1) marks.push({ type: "bold" });
      if (format & 2) marks.push({ type: "italic" });
      if (format & 4) marks.push({ type: "underline" });
      if (format & 8) marks.push({ type: "strike" });
      if (format & 16) marks.push({ type: "code" });
      return { type: "text", text, marks: marks.length ? marks : undefined };
    }

    case "link": {
      const href = String(n.url ?? "");
      const linkContent = children?.length ? children : undefined;
      if (linkContent) {
        return {
          type: "paragraph",
          content: linkContent.map((child) => ({
            ...child,
            marks: [
              ...(child.marks ?? []),
              { type: "link", attrs: { href, target: n.newTab ? "_blank" : "_self" } },
            ],
          })),
        };
      }
      return null;
    }

    case "quote":
      return { type: "blockquote", content: children?.length ? children : [{ type: "paragraph" }] };

    case "list": {
      const listType = n.listType === "number" ? "orderedList" : "bulletList";
      return { type: listType, content: children?.length ? children : [] };
    }

    case "listitem":
      return {
        type: "listItem",
        content: children?.length
          ? children.map((c) => (c.type === "text" ? { type: "paragraph", content: [c] } : c))
          : [{ type: "paragraph" }],
      };

    case "horizontalrule":
      return { type: "horizontalRule" };

    case "linebreak":
      return { type: "hardBreak" };

    case "upload": {
      const val = n.value as Record<string, string> | undefined;
      if (val?.url) {
        return { type: "image", attrs: { src: val.url, alt: val.alt ?? "" } };
      }
      return null;
    }

    default:
      if (children?.length) {
        return { type: "paragraph", content: children };
      }
      return null;
  }
}
