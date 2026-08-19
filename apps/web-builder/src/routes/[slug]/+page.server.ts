import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageServerLoad } from "./$types";
import { journalApi } from "$lib/api";

/** Tells SvelteKit which /[slug]/ pages exist so it can prerender each (PRD §17). */
export const entries: EntryGenerator = async () => {
  const pages = await journalApi.getPages();
  return pages.filter((p) => p.slug !== "home" && p.slug !== "index").map((p) => ({ slug: p.slug }));
};

export const load: PageServerLoad = async ({ params, parent }) => {
  const { pages } = await parent();
  const page = pages.find((p) => p.slug === params.slug);
  if (!page) throw error(404, "Page not found");
  return { title: page.title, blocks: page.blocks as { id: string; type: string; props: Record<string, unknown> }[] };
};
