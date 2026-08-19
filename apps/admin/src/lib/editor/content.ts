import type { TiptapDoc } from "@journal/shared-types";

export type { TiptapDoc };

export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };
