/**
 * Minimal Tiptap/ProseMirror JSON -> HTML renderer (PRD §12) covering the
 * "rich editor minimal feature set" from PRD §11: bold, italic, heading,
 * paragraph, lists, link, image, quote, table, code, alignment.
 */
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarks(text: string, marks: TiptapNode["marks"] = []): string {
  return marks.reduce((html, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${html}</strong>`;
      case "italic":
        return `<em>${html}</em>`;
      case "code":
        return `<code>${html}</code>`;
      case "link":
        return `<a href="${escapeHtml(String(mark.attrs?.href ?? "#"))}" rel="noopener">${html}</a>`;
      default:
        return html;
    }
  }, escapeHtml(text));
}

function styleFor(attrs?: Record<string, unknown>): string {
  const align = attrs?.textAlign;
  return align ? ` style="text-align:${escapeHtml(String(align))}"` : "";
}

function renderNode(node: TiptapNode): string {
  const children = (node.content ?? []).map(renderNode).join("");

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p${styleFor(node.attrs)}>${children}</p>`;
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return `<h${level}${styleFor(node.attrs)}>${children}</h${level}>`;
    }
    case "text":
      return renderMarks(node.text ?? "", node.marks);
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${children}</code></pre>`;
    case "image":
      return `<img src="${escapeHtml(String(node.attrs?.src ?? ""))}" alt="${escapeHtml(
        String(node.attrs?.alt ?? ""),
      )}" />`;
    case "table":
      return `<table>${children}</table>`;
    case "tableRow":
      return `<tr>${children}</tr>`;
    case "tableCell":
      return `<td>${children}</td>`;
    case "tableHeader":
      return `<th>${children}</th>`;
    case "hardBreak":
      return "<br />";
    default:
      return children;
  }
}

export function renderTiptapDoc(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  return renderNode(doc as TiptapNode);
}
