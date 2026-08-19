<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
  $: article = data.article;

  // Prefer other articles from the same issue so "more articles" is
  // actually related, then fill out to a full row with recent ones.
  $: sameIssue = data.articles.filter((a) => a.id !== article.id && a.issue?.id === article.issue?.id);
  $: others = data.articles.filter((a) => a.id !== article.id && a.issue?.id !== article.issue?.id);
  $: moreArticles = [...sameIssue, ...others].slice(0, 4);
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

{#if moreArticles.length > 0}
  <section class="more">
    <div class="more-inner">
      <h2>More Articles</h2>
      <div class="more-grid">
        {#each moreArticles as other (other.id)}
          <a class="more-card" href={`/articles/${other.slug}/`}>
            {#if other.thumbnailUrl}
              <img class="more-thumb" src={other.thumbnailUrl} alt="" loading="lazy" />
            {:else}
              <div class="more-thumb placeholder" aria-hidden="true">
                <span>{other.title.slice(0, 1).toUpperCase()}</span>
              </div>
            {/if}
            <div class="more-body">
              <h3>{other.title}</h3>
              {#if other.publicationDate}
                <span class="more-date">
                  {new Date(other.publicationDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
      <a class="more-all" href="/articles/">Browse all articles →</a>
    </div>
  </section>
{/if}

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

  .more {
    margin-top: 2rem;
    padding: 2.5rem 1.5rem;
    background: var(--theme-surface, #f8fafc);
    border-top: 1px solid var(--theme-border, #e5e7eb);
  }
  .more-inner {
    max-width: 72rem;
    margin: 0 auto;
  }
  .more-inner h2 {
    margin: 0 0 1.1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--theme-fg, #111827);
  }
  .more-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1rem;
  }
  .more-card {
    display: flex;
    flex-direction: column;
    border-radius: 0.65rem;
    border: 1px solid var(--theme-border, #e5e7eb);
    background: #fff;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .more-card:hover {
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }
  .more-thumb {
    width: 100%;
    height: 6.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }
  .more-thumb.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--theme-primary, #1d4ed8), var(--theme-secondary, #0ea5e9));
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.75rem;
    font-weight: 800;
  }
  .more-body {
    padding: 0.75rem 0.9rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .more-body h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--theme-fg, #111827);
  }
  .more-date {
    font-size: 0.7rem;
    color: var(--theme-muted, #6b7280);
  }
  .more-all {
    display: inline-block;
    margin-top: 1.25rem;
    font-size: 0.85rem;
    color: var(--theme-primary, #1d4ed8);
    text-decoration: none;
  }
</style>
