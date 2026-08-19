<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
  $: article = data.article;
</script>

<svelte:head><title>{article.title}</title></svelte:head>

<article class="article-mirror">
  <h1>{article.title}</h1>

  <p class="authors">
    {article.authors.map((a) => a.author.name).join(", ")}
  </p>

  {#if article.issue}
    <p class="issue-line">
      Vol {article.issue.volume ?? "-"}, No {article.issue.number ?? "-"} ({article.issue.year ?? "-"})
      {#if article.pages}&middot; pp. {article.pages}{/if}
    </p>
  {/if}

  {#if article.publicationDate}
    <p class="date">Published {new Date(article.publicationDate).toLocaleDateString()}</p>
  {/if}

  {#if article.doi}
    <p class="doi">DOI: <a href={`https://doi.org/${article.doi}`}>{article.doi}</a></p>
  {/if}

  {#if article.abstract}
    <section class="abstract">
      <h2>Abstract</h2>
      <p>{article.abstract}</p>
    </section>
  {/if}

  {#if article.keywords.length > 0}
    <p class="keywords">Keywords: {article.keywords.join(", ")}</p>
  {/if}

  {#if article.pdfUrl}
    <a class="download" href={article.pdfUrl}>Download PDF</a>
  {/if}
</article>

<style>
  .article-mirror {
    max-width: 72ch;
    margin: 0 auto;
    padding: 2rem;
  }
  .authors {
    font-weight: 600;
  }
  .issue-line,
  .date,
  .doi,
  .keywords {
    color: var(--theme-muted, #6b7280);
    font-size: 0.9rem;
  }
  .download {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.6rem 1.4rem;
    border-radius: 0.375rem;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    text-decoration: none;
  }
</style>
