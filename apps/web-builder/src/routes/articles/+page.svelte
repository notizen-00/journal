<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head><title>Articles</title></svelte:head>

<section class="article-index">
  <h1>Articles</h1>
  <ul>
    {#each data.articles as article (article.id)}
      <li>
        <a href={`/articles/${article.slug}/`}>{article.title}</a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .article-index {
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
