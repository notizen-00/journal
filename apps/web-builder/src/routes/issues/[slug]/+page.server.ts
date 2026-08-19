import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageServerLoad } from "./$types";
import { journalApi } from "$lib/api";
import { issueSlug } from "$lib/slug";

export const entries: EntryGenerator = async () => {
  const issues = await journalApi.getIssues();
  return issues.map((issue) => ({ slug: issueSlug(issue) }));
};

export const load: PageServerLoad = async ({ params, parent }) => {
  const { issues } = await parent();
  const issue = issues.find((i) => issueSlug(i) === params.slug);
  if (!issue) throw error(404, "Issue not found");
  return { issue };
};
