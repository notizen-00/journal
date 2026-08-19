import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { pages } = await parent();
  const home = pages.find((p) => p.slug === "home" || p.slug === "index");
  return { blocks: (home?.blocks ?? []) as { id: string; type: string; props: Record<string, unknown> }[] };
};
