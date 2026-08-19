/**
 * Conversion between the editor's contenteditable DOM and the
 * Tiptap/ProseMirror JSON document shape (PRD §12, §13).
 *
 * The JSON shape is not negotiable: it is what `Page.blocks` stores and what
 * the static site's `renderTiptapDoc` consumes. This editor is hand-rolled,
 * but it reads and writes exactly that format so existing pages keep
 * rendering and nothing downstream has to change.
 */

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };

/* ------------------------------------------------------------------ */
/* JSON -> HTML                                                        */
/* ------------------------------------------------------------------ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Marks are nested HTML, so the same set can serialize two different ways
 * (`<em><strong>` vs `<strong><em>`). Both directions sort into this fixed
 * order, otherwise every save would flip the nesting and mark the page
 * dirty even when nothing was edited.
 */
const MARK_ORDER = ["link", "code", "bold", "italic", "underline", "strike"];

function sortMarks(marks: TiptapMark[]): TiptapMark[] {
  return [...marks].sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
}

function applyMarks(html: string, marks: TiptapMark[] = []): string {
  return sortMarks(marks).reduce((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${acc}</strong>`;
      case "italic":
        return `<em>${acc}</em>`;
      case "underline":
        return `<u>${acc}</u>`;
      case "strike":
        return `<s>${acc}</s>`;
      case "code":
        return `<code>${acc}</code>`;
      case "link":
        return `<a href="${escapeHtml(String(mark.attrs?.href ?? "#"))}">${acc}</a>`;
      default:
        return acc;
    }
  }, html);
}

function alignStyle(attrs?: Record<string, unknown>): string {
  const align = attrs?.textAlign;
  return align ? ` style="text-align:${escapeHtml(String(align))}"` : "";
}

function nodeToHtml(node: TiptapNode): string {
  const children = (node.content ?? []).map(nodeToHtml).join("");

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      // An empty <p> collapses in contenteditable, so keep a <br> placeholder.
      return `<p${alignStyle(node.attrs)}>${children || "<br>"}</p>`;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 2)));
      return `<h${level}${alignStyle(node.attrs)}>${children || "<br>"}</h${level}>`;
    }
    case "text":
      return applyMarks(escapeHtml(node.text ?? ""), node.marks);
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${children || "<br>"}</code></pre>`;
    case "horizontalRule":
      return "<hr>";
    case "image":
      return `<img src="${escapeHtml(String(node.attrs?.src ?? ""))}" alt="${escapeHtml(
        String(node.attrs?.alt ?? ""),
      )}">`;
    case "table":
      return `<table>${children}</table>`;
    case "tableRow":
      return `<tr>${children}</tr>`;
    case "tableCell":
      return `<td>${children}</td>`;
    case "tableHeader":
      return `<th>${children}</th>`;
    case "hardBreak":
      return "<br>";
    default:
      return children;
  }
}

export function docToHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  return nodeToHtml(doc as TiptapNode);
}

/* ------------------------------------------------------------------ */
/* DOM -> JSON                                                         */
/* ------------------------------------------------------------------ */

const MARK_TAGS: Record<string, string> = {
  STRONG: "bold",
  B: "bold",
  EM: "italic",
  I: "italic",
  U: "underline",
  S: "strike",
  STRIKE: "strike",
  DEL: "strike",
  CODE: "code",
};

function readAlign(el: HTMLElement): Record<string, unknown> | undefined {
  const align = el.style.textAlign;
  return align && align !== "left" ? { textAlign: align } : undefined;
}

/** Collects inline content, threading active marks down through the tree. */
function parseInline(node: Node, marks: TiptapMark[], out: TiptapNode[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) return;
    out.push(marks.length ? { type: "text", text, marks: sortMarks(marks) } : { type: "text", text });
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;

  if (el.tagName === "BR") {
    out.push({ type: "hardBreak" });
    return;
  }
  if (el.tagName === "IMG") {
    out.push({
      type: "image",
      attrs: { src: el.getAttribute("src") ?? "", alt: el.getAttribute("alt") ?? "" },
    });
    return;
  }

  let nextMarks = marks;
  if (el.tagName === "A") {
    nextMarks = [...marks, { type: "link", attrs: { href: el.getAttribute("href") ?? "" } }];
  } else if (MARK_TAGS[el.tagName]) {
    const markType = MARK_TAGS[el.tagName];
    if (!marks.some((m) => m.type === markType)) nextMarks = [...marks, { type: markType }];
  } else if (el.tagName === "SPAN") {
    // contenteditable emits styled spans; map the ones that carry meaning.
    const extra: TiptapMark[] = [];
    const weight = el.style.fontWeight;
    if (weight === "bold" || Number(weight) >= 600) extra.push({ type: "bold" });
    if (el.style.fontStyle === "italic") extra.push({ type: "italic" });
    if (el.style.textDecorationLine?.includes("underline") || el.style.textDecoration?.includes("underline")) {
      extra.push({ type: "underline" });
    }
    nextMarks = [...marks, ...extra.filter((m) => !marks.some((existing) => existing.type === m.type))];
  }

  for (const child of Array.from(el.childNodes)) parseInline(child, nextMarks, out);
}

function inlineContentOf(el: HTMLElement): TiptapNode[] {
  const out: TiptapNode[] = [];
  for (const child of Array.from(el.childNodes)) parseInline(child, [], out);
  // A lone <br> is the placeholder that keeps an empty block selectable in
  // contenteditable, not authored content — drop it so empty paragraphs
  // round-trip as empty rather than growing a hardBreak.
  if (out.length === 1 && out[0].type === "hardBreak") return [];
  return out;
}

function parseBlock(el: HTMLElement, out: TiptapNode[]): void {
  const tag = el.tagName;

  switch (tag) {
    case "P": {
      const content = inlineContentOf(el);
      out.push({ type: "paragraph", ...(readAlign(el) ? { attrs: readAlign(el) } : {}), ...(content.length ? { content } : {}) });
      return;
    }
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      const content = inlineContentOf(el);
      out.push({
        type: "heading",
        attrs: { level: Number(tag[1]), ...readAlign(el) },
        ...(content.length ? { content } : {}),
      });
      return;
    }
    case "UL":
    case "OL": {
      const items: TiptapNode[] = [];
      for (const li of Array.from(el.children)) {
        if (li.tagName !== "LI") continue;
        items.push({ type: "listItem", content: wrapAsBlocks(li as HTMLElement) });
      }
      if (items.length) out.push({ type: tag === "UL" ? "bulletList" : "orderedList", content: items });
      return;
    }
    case "BLOCKQUOTE":
      out.push({ type: "blockquote", content: wrapAsBlocks(el) });
      return;
    case "PRE": {
      out.push({
        type: "codeBlock",
        content: el.textContent ? [{ type: "text", text: el.textContent }] : [],
      });
      return;
    }
    case "HR":
      out.push({ type: "horizontalRule" });
      return;
    case "IMG":
      out.push({
        type: "image",
        attrs: { src: el.getAttribute("src") ?? "", alt: el.getAttribute("alt") ?? "" },
      });
      return;
    case "TABLE": {
      const rows: TiptapNode[] = [];
      // Skip the tbody/thead wrappers the browser inserts automatically.
      const rowEls = el.querySelectorAll("tr");
      for (const tr of Array.from(rowEls)) {
        const cells: TiptapNode[] = [];
        for (const cell of Array.from(tr.children)) {
          if (cell.tagName !== "TD" && cell.tagName !== "TH") continue;
          cells.push({
            type: cell.tagName === "TH" ? "tableHeader" : "tableCell",
            content: wrapAsBlocks(cell as HTMLElement),
          });
        }
        if (cells.length) rows.push({ type: "tableRow", content: cells });
      }
      if (rows.length) out.push({ type: "table", content: rows });
      return;
    }
    case "DIV":
      // Some browsers wrap lines in DIVs; treat each as a paragraph.
      for (const block of wrapAsBlocks(el)) out.push(block);
      return;
    default: {
      const content = inlineContentOf(el);
      if (content.length) out.push({ type: "paragraph", content });
    }
  }
}

// IMG is here so an image sitting directly in the document stays a
// top-level image node instead of being re-wrapped in a paragraph on every
// save. Images *inside* a paragraph are still handled inline by parseInline.
const BLOCK_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "PRE", "HR", "TABLE", "DIV", "IMG",
]);

/**
 * Reads a container's children as block nodes, gathering any loose inline
 * content (bare text typed straight into the editor) into paragraphs.
 */
function wrapAsBlocks(container: HTMLElement): TiptapNode[] {
  const blocks: TiptapNode[] = [];
  let pending: TiptapNode[] = [];

  const flush = () => {
    // Same rule as inlineContentOf: a lone <br> is contenteditable's
    // caret-placeholder, not content — most commonly the stray trailing
    // <br> browsers leave at the end of the editor.
    const isLoneBreak = pending.length === 1 && pending[0].type === "hardBreak";
    if (pending.length && !isLoneBreak) {
      blocks.push({ type: "paragraph", content: pending });
    }
    pending = [];
  };

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((child as HTMLElement).tagName)) {
      flush();
      parseBlock(child as HTMLElement, blocks);
    } else {
      parseInline(child, [], pending);
    }
  }
  flush();

  return blocks;
}

export function htmlToDoc(root: HTMLElement): TiptapDoc {
  const content = wrapAsBlocks(root);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Plain-text preview used for the editor's word/character counters. */
export function docToText(doc: unknown): string {
  const walk = (node: TiptapNode): string => {
    if (node.type === "text") return node.text ?? "";
    const inner = (node.content ?? []).map(walk).join(node.type === "doc" ? "\n" : "");
    return inner;
  };
  if (!doc || typeof doc !== "object") return "";
  return walk(doc as TiptapNode);
}
