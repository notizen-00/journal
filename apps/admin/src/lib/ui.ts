import { writable } from "svelte/store";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Pages publish their breadcrumb trail here so the shared topbar can render
 * it. SvelteKit does not pass named slots from a page up into its layout,
 * so a store is the way the two communicate.
 */
export const breadcrumbs = writable<Crumb[]>([]);
