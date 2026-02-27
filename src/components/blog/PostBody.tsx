// Rich text body renderer for Payload CMS Lexical content
// The body is stored as JSON (Lexical state)

interface PostBodyProps {
  body: unknown;
}

export function PostBody({ body }: PostBodyProps) {
  if (!body) return null;

  // Render Lexical JSON as HTML
  // For full Lexical rendering, install @payloadcms/richtext-lexical/react
  // For now we render a simplified version of the content
  const rendered = renderLexical(body);

  return (
    <div
      className="prose prose-zinc dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-brand prose-blockquote:text-muted-foreground prose-code:text-brand prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-strong:text-foreground max-w-none"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

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
      let text = String(n.text ?? "");
      if ((n.format as number) & 1) text = `<strong>${text}</strong>`;
      if ((n.format as number) & 2) text = `<em>${text}</em>`;
      if ((n.format as number) & 4) text = `<u>${text}</u>`;
      if ((n.format as number) & 8) text = `<s>${text}</s>`;
      if ((n.format as number) & 16) text = `<code>${text}</code>`;
      return text;
    }
    case "link":
      return `<a href="${n.url}" target="${n.newTab ? "_blank" : "_self"}" rel="noopener noreferrer">${children}</a>`;
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
        return `<figure><img src="${val.url}" alt="${val.alt ?? ""}" />${val.caption ? `<figcaption>${val.caption}</figcaption>` : ""}</figure>`;
      }
      return "";
    }
    default:
      return children;
  }
}
