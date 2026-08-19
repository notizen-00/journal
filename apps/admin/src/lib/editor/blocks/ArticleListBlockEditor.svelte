<script lang="ts">
  import { onMount } from "svelte";
  import type { ArticleListBlock } from "@journal/shared-types";
  import { api } from "$lib/api";

  export let props: ArticleListBlock["props"];
  export let journalId: string;

  interface Issue {
    id: string;
    volume: string | null;
    number: string | null;
    year: number | null;
  }
  let issues: Issue[] = [];

  function issueLabel(issue: Issue) {
    return `Vol ${issue.volume ?? "-"} No ${issue.number ?? "-"}${issue.year ? ` (${issue.year})` : ""}`;
  }

  onMount(async () => {
    try {
      issues = await api.get<Issue[]>(`/journals/${journalId}/issues`);
    } catch {
      // Non-fatal — the block just won't offer an issue filter.
    }
  });
</script>

<div class="grid">
  <div class="field">
    <label for="al-title">Heading</label>
    <input id="al-title" bind:value={props.title} placeholder="Recent Articles" />
  </div>
  <div class="row">
    <div class="field">
      <label for="al-limit">Max articles</label>
      <input id="al-limit" type="number" min="1" max="50" bind:value={props.limit} />
    </div>
    <div class="field">
      <label for="al-issue">Filter to issue</label>
      <select id="al-issue" bind:value={props.issueId}>
        <option value={undefined}>All issues</option>
        {#each issues as issue (issue.id)}
          <option value={issue.id}>{issueLabel(issue)}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }
  @media (max-width: 560px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
