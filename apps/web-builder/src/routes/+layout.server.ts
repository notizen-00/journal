import type { LayoutServerLoad } from "./$types";
import { journalApi } from "$lib/api";

export const prerender = true;
// Emits <route>/index.html instead of <route>.html, matching PRD §17's output tree.
export const trailingSlash = "always";

export const load: LayoutServerLoad = async () => {
  const [journal, menus, articles, issues, pages] = await Promise.all([
    journalApi.getJournal(),
    journalApi.getMenus(),
    journalApi.getArticles(),
    journalApi.getIssues(),
    journalApi.getPages(),
  ]);

  return { journal, menus, articles, issues, pages };
};
