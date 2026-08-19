import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageServerLoad } from "./$types";
import { journalApi } from "$lib/api";

export const entries: EntryGenerator = async () => {
  const articles = await journalApi.getArticles();
  return articles.map((a) => ({ slug: a.slug }));
};

export const load: PageServerLoad = async ({ params, parent }) => {
  const { articles } = await parent();
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) throw error(404, "Article not found");
  return { article };
};
