/**
 * Page builder block model (PRD §13). Stored as `content_json` / `blocks`
 * on a Page, authored in the admin CMS via block editors + Tiptap for rich
 * text, and rendered by the Svelte static builder theme layer.
 */
export type BlockType =
  | "hero"
  | "richText"
  | "image"
  | "articleList"
  | "issueList"
  | "editorialTeam"
  | "callout"
  | "button"
  | "html";

export interface BaseBlock<T extends BlockType, P> {
  id: string;
  type: T;
  props: P;
}

export type HeroBlock = BaseBlock<
  "hero",
  { title: string; subtitle?: string; imageUrl?: string; ctaLabel?: string; ctaUrl?: string }
>;

export type RichTextBlock = BaseBlock<"richText", { contentJson: TiptapDoc }>;

export type ImageBlock = BaseBlock<"image", { url: string; alt?: string; caption?: string }>;

export type ArticleListBlock = BaseBlock<
  "articleList",
  { title?: string; limit?: number; issueId?: string }
>;

export type IssueListBlock = BaseBlock<"issueList", { title?: string; limit?: number }>;

export type EditorialTeamBlock = BaseBlock<
  "editorialTeam",
  { title?: string; members: { name: string; role: string; affiliation?: string }[] }
>;

export type CalloutBlock = BaseBlock<
  "callout",
  { variant: "info" | "warning" | "success"; text: string }
>;

export type ButtonBlock = BaseBlock<"button", { label: string; url: string }>;

export type HtmlBlock = BaseBlock<"html", { html: string }>;

export type Block =
  | HeroBlock
  | RichTextBlock
  | ImageBlock
  | ArticleListBlock
  | IssueListBlock
  | EditorialTeamBlock
  | CalloutBlock
  | ButtonBlock
  | HtmlBlock;

/** Minimal Tiptap/ProseMirror JSON doc shape (PRD §12). */
export interface TiptapDoc {
  type: "doc";
  content: unknown[];
}
