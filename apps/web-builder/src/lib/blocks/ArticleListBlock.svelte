<script lang="ts">
  import type { ArticleData } from "$lib/api";

  export let props: { title?: string; limit?: number; issueId?: string };
  export let articles: ArticleData[] = [];

  $: filtered = (props.issueId ? articles.filter((a) => a.issue?.id === props.issueId) : articles).slice(
    0,
    props.limit ?? 10,
  );
</script>

<section class="article-list">
  {#if props.title}<h2>{props.title}</h2>{/if}
  <ul>
    {#each filtered as article (article.id)}
      <li>
        <a href={`/articles/${article.slug}/`}>{article.title}</a>
        {#if article.publicationDate}
          <span class="date">{new Date(article.publicationDate).toLocaleDateString()}</span>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .article-list {
    padding: 1rem 2rem;
  }
  .article-list ul {
    list-style: none;
    padding: 0;
  }
  .article-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
  }
  .date {
    margin-left: 0.5rem;
    color: var(--theme-muted, #6b7280);
    font-size: 0.875rem;
  }
</style>
