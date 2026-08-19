import type { IssueData } from "./api";

/** Matches PRD §17 output naming, e.g. /issues/volume-21-no-3/. */
export function issueSlug(issue: Pick<IssueData, "id" | "volume" | "number">): string {
  if (issue.volume || issue.number) {
    return `volume-${issue.volume ?? "x"}-no-${issue.number ?? "x"}`.toLowerCase();
  }
  return issue.id;
}
