<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  $: sorted = [...data.articles].sort(
    (a, b) => new Date(b.publicationDate ?? 0).getTime() - new Date(a.publicationDate ?? 0).getTime(),
  );
</script>

<svelte:head><title>Articles</title></svelte:head>

<section class="article-index">
  <div class="index-head">
    <h1>Articles</h1>
    <p class="muted">{sorted.length} article{sorted.length === 1 ? "" : "s"} published</p>
  </div>

  {#if sorted.length === 0}
    <p class="muted">No articles yet.</p>
  {:else}
    <div class="grid">
      {#each sorted as article (article.id)}
        <a class="card" href={`/articles/${article.slug}/`}>
          {#if article.thumbnailUrl}
            <img class="thumb" src={article.thumbnailUrl} alt="" loading="lazy" />
          {:else}
            <div class="thumb placeholder" aria-hidden="true">
              <span>{article.title.slice(0, 1).toUpperCase()}</span>
            </div>
          {/if}
          <div class="card-body">
            <h2>{article.title}</h2>
            {#if article.abstract}<p class="excerpt">{article.abstract.slice(0, 130)}…</p>{/if}
            <div class="meta">
              {#if article.publicationDate}
                <span>{new Date(article.publicationDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
              {/if}
              {#if article.issue}
                <span>Vol {article.issue.volume ?? "-"} No {article.issue.number ?? "-"}</span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .article-index {
    max-width: 72rem;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 4rem;
  }
  .index-head {
    margin-bottom: 1.75rem;
  }
  .index-head h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 800;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1.25rem;
  }
  .card {
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    border: 1px solid var(--theme-border, #e5e7eb);
    background: #fff;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .card:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }
  .thumb {
    width: 100%;
    height: 9rem;
    object-fit: cover;
    flex-shrink: 0;
  }
  .thumb.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--theme-primary, #1d4ed8), var(--theme-secondary, #0ea5e9));
    color: rgba(255, 255, 255, 0.85);
    font-size: 2.5rem;
    font-weight: 800;
  }
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.1rem 1.25rem 1.25rem;
    flex: 1;
  }
  .card-body h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    line-height: 1.35;
    color: var(--theme-fg, #111827);
  }
  .excerpt {
    margin: 0;
    font-size: 0.85rem;
    color: var(--theme-muted, #6b7280);
    line-height: 1.5;
  }
  .meta {
    margin-top: auto;
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--theme-muted, #6b7280);
  }
</style>
