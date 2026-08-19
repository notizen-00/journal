<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
  $: issue = data.issue;
</script>

<svelte:head><title>{issue.title ?? `Vol ${issue.volume} No ${issue.number}`}</title></svelte:head>

<section class="issue-detail">
  <h1>{issue.title ?? `Vol ${issue.volume ?? "-"} No ${issue.number ?? "-"} (${issue.year ?? "-"})`}</h1>
  <ul>
    {#each issue.articles as article (article.id)}
      <li><a href={`/articles/${article.slug}/`}>{article.title}</a></li>
    {/each}
  </ul>
</section>

<style>
  .issue-detail {
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
