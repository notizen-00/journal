import type { Block, BlockType } from "@journal/shared-types";
import { EMPTY_DOC } from "../content";

export interface BlockMeta {
  label: string;
  icon: string;
  defaultProps: () => Block["props"];
  summary: (props: unknown) => string;
}

// Every field a type declares is filled in here (never left `undefined`) so
// inputs bound to it always start controlled, and legacy/partial blocks
// from before this editor existed normalize into something editable.
export const BLOCK_META: Record<BlockType, BlockMeta> = {
  hero: {
    label: "Hero",
    icon: "🎯",
    defaultProps: () => ({ title: "", subtitle: "", imageUrl: "", ctaLabel: "", ctaUrl: "" }),
    summary: (p) => (p as { title: string }).title || "Untitled hero",
  },
  richText: {
    label: "Rich Text",
    icon: "📝",
    defaultProps: () => ({ contentJson: EMPTY_DOC }),
    summary: () => "Text content",
  },
  image: {
    label: "Image",
    icon: "🖼",
    defaultProps: () => ({ url: "", alt: "", caption: "" }),
    summary: (p) => (p as { caption?: string }).caption || "Image",
  },
  articleList: {
    label: "Article List",
    icon: "📚",
    defaultProps: () => ({ title: "Recent Articles", limit: 6 }),
    summary: (p) => (p as { title?: string }).title || "Article list",
  },
  issueList: {
    label: "Issue List",
    icon: "📖",
    defaultProps: () => ({ title: "Latest Issues", limit: 6 }),
    summary: (p) => (p as { title?: string }).title || "Issue list",
  },
  editorialTeam: {
    label: "Editorial Team",
    icon: "👥",
    defaultProps: () => ({ title: "Editorial Board", members: [] }),
    summary: (p) => {
      const props = p as { title?: string; members: unknown[] };
      return `${props.title || "Editorial team"} · ${props.members.length} member${props.members.length === 1 ? "" : "s"}`;
    },
  },
  callout: {
    label: "Callout",
    icon: "💬",
    defaultProps: () => ({ variant: "info", text: "" }),
    summary: (p) => (p as { text: string }).text.slice(0, 60) || "Callout",
  },
  button: {
    label: "Button",
    icon: "🔘",
    defaultProps: () => ({ label: "", url: "" }),
    summary: (p) => (p as { label: string }).label || "Untitled button",
  },
  html: {
    label: "Custom HTML",
    icon: "🔧",
    defaultProps: () => ({ html: "" }),
    summary: () => "Raw HTML",
  },
};

export const BLOCK_ORDER: BlockType[] = [
  "hero", "richText", "image", "articleList", "issueList", "editorialTeam", "callout", "button", "html",
];

function newBlockId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Fills in any fields missing from a raw block loaded from the API — either
 * a block saved before this editor existed (the old single-richText save
 * path) or one authored by hand via the API — so every editor's bound
 * inputs start controlled instead of hitting `undefined`.
 */
export function normalizeBlock(raw: { id?: string; type: string; props?: Record<string, unknown> }): Block {
  const meta = BLOCK_META[raw.type as BlockType];
  if (!meta) {
    // Unknown block type (future/removed type, or hand-edited data) —
    // preserved as-is via the html editor so it round-trips without
    // silently discarding data the UI doesn't recognize.
    return {
      id: raw.id ?? newBlockId(),
      type: "html",
      props: { html: typeof raw.props?.html === "string" ? raw.props.html : JSON.stringify(raw) },
    } as Block;
  }
  return {
    id: raw.id ?? newBlockId(),
    type: raw.type,
    props: { ...meta.defaultProps(), ...raw.props },
  } as Block;
}

export function normalizeBlocks(raw: { id?: string; type: string; props?: Record<string, unknown> }[]): Block[] {
  return raw.map(normalizeBlock);
}
