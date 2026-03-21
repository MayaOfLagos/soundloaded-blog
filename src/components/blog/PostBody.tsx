interface PostBodyProps {
  body: unknown;
}

export function PostBody({ body }: PostBodyProps) {
  if (!body) return null;

  const rendered = isLexicalFormat(body) ? renderLexical(body) : renderTiptap(body);

  return (
    <div
      className="prose prose-zinc dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-brand prose-blockquote:text-muted-foreground prose-code:text-brand prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-strong:text-foreground max-w-none"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function isLexicalFormat(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return "root" in b;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Tiptap / ProseMirror JSON renderer ───

function renderTiptap(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;

  const children = Array.isArray(n.content)
    ? (n.content as unknown[]).map(renderTiptap).join("")
    : "";

  switch (n.type) {
    case "doc":
      return children;
    case "paragraph":
      return children ? `<p>${children}</p>` : "<p>&nbsp;</p>";
    case "heading": {
      const level = (n.attrs as Record<string, unknown>)?.level ?? 2;
      return `<h${level}>${children}</h${level}>`;
    }
    case "text": {
      let text = escapeHtml(String(n.text ?? ""));
      const marks = Array.isArray(n.marks) ? (n.marks as Record<string, unknown>[]) : [];
      for (const mark of marks) {
        switch (mark.type) {
          case "bold":
            text = `<strong>${text}</strong>`;
            break;
          case "italic":
            text = `<em>${text}</em>`;
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
          case "strike":
            text = `<s>${text}</s>`;
            break;
          case "code":
            text = `<code>${text}</code>`;
            break;
          case "link": {
            const attrs = mark.attrs as Record<string, string> | undefined;
            const href = escapeHtml(attrs?.href ?? "");
            const target = attrs?.target ?? "_blank";
            text = `<a href="${href}" target="${target}" rel="noopener noreferrer">${text}</a>`;
            break;
          }
        }
      }
      return text;
    }
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock": {
      const lang = (n.attrs as Record<string, unknown>)?.language ?? "";
      return `<pre><code${lang ? ` class="language-${escapeHtml(String(lang))}"` : ""}>${children}</code></pre>`;
    }
    case "image": {
      const attrs = n.attrs as Record<string, string> | undefined;
      if (attrs?.src) {
        const alt = escapeHtml(attrs.alt ?? "");
        return `<figure><img src="${escapeHtml(attrs.src)}" alt="${alt}" />${attrs.title ? `<figcaption>${escapeHtml(attrs.title)}</figcaption>` : ""}</figure>`;
      }
      return "";
    }
    case "htmlBlock": {
      const attrs = n.attrs as Record<string, string> | undefined;
      return attrs?.html ?? "";
    }
    case "horizontalRule":
      return "<hr />";
    case "hardBreak":
      return "<br />";
    default:
      return children;
  }
}

// ─── Lexical JSON renderer (backward compat) ───

function renderLexical(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;

  if (n.root) return renderLexical(n.root);

  const children = Array.isArray(n.children)
    ? (n.children as unknown[]).map(renderLexical).join("")
    : "";

  switch (n.type) {
    case "root":
    case "paragraph":
      return children ? `<p>${children}</p>` : "<p>&nbsp;</p>";
    case "heading":
      return `<h${n.tag}>${children}</h${n.tag}>`;
    case "text": {
      let text = escapeHtml(String(n.text ?? ""));
      if ((n.format as number) & 1) text = `<strong>${text}</strong>`;
      if ((n.format as number) & 2) text = `<em>${text}</em>`;
      if ((n.format as number) & 4) text = `<u>${text}</u>`;
      if ((n.format as number) & 8) text = `<s>${text}</s>`;
      if ((n.format as number) & 16) text = `<code>${text}</code>`;
      return text;
    }
    case "link":
      return `<a href="${escapeHtml(String(n.url ?? ""))}" target="${n.newTab ? "_blank" : "_self"}" rel="noopener noreferrer">${children}</a>`;
    case "quote":
      return `<blockquote>${children}</blockquote>`;
    case "list":
      return n.listType === "number" ? `<ol>${children}</ol>` : `<ul>${children}</ul>`;
    case "listitem":
      return `<li>${children}</li>`;
    case "horizontalrule":
      return "<hr />";
    case "linebreak":
      return "<br />";
    case "upload": {
      const val = n.value as Record<string, string> | undefined;
      if (val?.url) {
        return `<figure><img src="${escapeHtml(val.url)}" alt="${escapeHtml(val.alt ?? "")}" />${val.caption ? `<figcaption>${escapeHtml(val.caption)}</figcaption>` : ""}</figure>`;
      }
      return "";
    }
    default:
      return children;
  }
}
