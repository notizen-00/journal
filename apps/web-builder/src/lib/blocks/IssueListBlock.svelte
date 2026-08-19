<script lang="ts">
  import type { IssueData } from "$lib/api";
  import { issueSlug } from "$lib/slug";

  export let props: { title?: string; limit?: number };
  export let issues: IssueData[] = [];

  $: filtered = issues.slice(0, props.limit ?? 10);
</script>

<section class="issue-list">
  {#if props.title}<h2>{props.title}</h2>{/if}
  <ul>
    {#each filtered as issue (issue.id)}
      <li>
        <a href={`/issues/${issueSlug(issue)}/`}>
          {issue.title ?? `Vol ${issue.volume ?? "-"} No ${issue.number ?? "-"} (${issue.year ?? "-"})`}
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .issue-list {
    padding: 1rem 2rem;
  }
  .issue-list ul {
    list-style: none;
    padding: 0;
  }
  .issue-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
  }
</style>
