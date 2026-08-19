<script lang="ts">
  import { issueSlug } from "$lib/slug";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head><title>Issues</title></svelte:head>

<section class="issue-index">
  <h1>Issues</h1>
  <ul>
    {#each data.issues as issue (issue.id)}
      <li>
        <a href={`/issues/${issueSlug(issue)}/`}>
          {issue.title ?? `Vol ${issue.volume ?? "-"} No ${issue.number ?? "-"} (${issue.year ?? "-"})`}
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .issue-index {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
  }
</style>
