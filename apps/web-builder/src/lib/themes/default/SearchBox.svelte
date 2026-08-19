<script lang="ts">
  import type { ArticleData } from "$lib/api";

  export let articles: ArticleData[] = [];

  let open = false;
  let query = "";
  let inputEl: HTMLInputElement | undefined;

  $: results =
    query.trim().length > 1
      ? articles
          .filter((a) => a.title.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  function openSearch() {
    open = true;
    queueMicrotask(() => inputEl?.focus());
  }

  function closeSearch() {
    open = false;
    query = "";
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") closeSearch();
  }
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

<div class="search">
  <button
    type="button"
    class="search-toggle"
    aria-label="Search articles"
    on:click={openSearch}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  </button>

  {#if open}
    <div class="search-panel" role="dialog" aria-label="Search articles">
      <div class="search-panel-inner">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          bind:this={inputEl}
          bind:value={query}
          type="search"
          placeholder="Search articles by title…"
        />
        <button type="button" class="close" aria-label="Close search" on:click={closeSearch}>✕</button>
      </div>

      {#if query.trim().length > 1}
        <ul class="results">
          {#if results.length === 0}
            <li class="empty">No articles found for "{query}"</li>
          {:else}
            {#each results as article (article.id)}
              <li>
                <a href={`/articles/${article.slug}/`} on:click={closeSearch}>{article.title}</a>
              </li>
            {/each}
          {/if}
        </ul>
      {/if}
    </div>
    <button type="button" class="scrim" aria-label="Close search" on:click={closeSearch}></button>
  {/if}
</div>

<style>
  .search {
    position: relative;
  }
  .search-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .search-toggle:hover {
    background: rgba(0, 0, 0, 0.06);
  }
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    border: none;
    padding: 0;
    z-index: 40;
    cursor: default;
  }
  .search-panel {
    position: absolute;
    top: calc(100% + 0.75rem);
    right: 0;
    width: min(26rem, 90vw);
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
    overflow: hidden;
    z-index: 50;
  }
  .search-panel-inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
    color: var(--theme-muted, #6b7280);
  }
  .search-panel-inner input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
    color: var(--theme-fg, #111827);
    background: transparent;
  }
  .close {
    border: none;
    background: transparent;
    color: var(--theme-muted, #6b7280);
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem;
  }
  .results {
    list-style: none;
    margin: 0;
    padding: 0.5rem;
    max-height: 20rem;
    overflow-y: auto;
  }
  .results li a {
    display: block;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    color: var(--theme-fg, #111827);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .results li a:hover {
    background: var(--theme-surface, #f8fafc);
  }
  .results .empty {
    padding: 0.75rem;
    color: var(--theme-muted, #6b7280);
    font-size: 0.875rem;
  }
</style>
