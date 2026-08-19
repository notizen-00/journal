/**
 * BullMQ queue names. Must stay in sync with apps/api/src/config/queues.ts —
 * duplicated (not shared as a runtime import) so the worker doesn't need a
 * build step on the type-only @journal/shared-types package.
 */
export const QUEUE_OAI_HARVEST = "oai-harvest";
export const QUEUE_STATIC_BUILD = "static-build";
