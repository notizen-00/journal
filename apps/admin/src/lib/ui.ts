import { getContext, setContext } from "svelte";
import { writable, type Writable } from "svelte/store";

export interface Crumb {
  label: string;
  href?: string;
}

const KEY = Symbol("breadcrumbs");

/**
 * Pages publish their breadcrumb trail here so the shared topbar can render
 * it. This must NOT be a plain module-level `writable()`: the admin server
 * runs with SSR (adapter-node), and a module-level store is a singleton for
 * the whole Node process — one admin's request setting it can leak into the
 * HTML another concurrent request renders. Context is created fresh per
 * component-tree instance (i.e. per request during SSR), which is exactly
 * what SvelteKit's own docs recommend in place of a shared store for this.
 */
export function createBreadcrumbsContext(): Writable<Crumb[]> {
  const store = writable<Crumb[]>([]);
  setContext(KEY, store);
  return store;
}

export function getBreadcrumbs(): Writable<Crumb[]> {
  const store = getContext<Writable<Crumb[]> | undefined>(KEY);
  if (!store) {
    throw new Error("getBreadcrumbs() called outside the layout that provides it");
  }
  return store;
}
