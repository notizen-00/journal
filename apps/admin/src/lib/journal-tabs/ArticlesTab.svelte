<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import Pagination from "$lib/components/Pagination.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SkeletonRows from "$lib/components/SkeletonRows.svelte";

  export let journalId: string;

  interface Article {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    doi: string | null;
    publicationDate: string | null;
    url: string | null;
    authors: { author: { name: string } }[];
    issue: { volume: string | null; number: string | null; year: number | null } | null;
  }

  interface MediaItem {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
  }

  let articles: Article[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let search = "";
  let loading = true;

  // Debounced so typing doesn't fire a request per keystroke.
  let debounce: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      page = 1;
      void load();
    }, 300);
  }

  async function load() {
    loading = true;
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search.trim()) params.set("search", search.trim());
      const result = await api.get<{ items: Article[]; total: number }>(
        `/journals/${journalId}/articles?${params}`,
      );
      articles = result.items;
      total = result.total;
    } catch (err) {
      toastError(err, "Could not load articles");
    } finally {
      loading = false;
    }
  }

  function onPageChange(e: CustomEvent<{ page: number; pageSize: number }>) {
    page = e.detail.page;
    pageSize = e.detail.pageSize;
    void load();
  }

  function authorNames(article: Article) {
    const names = article.authors.map((a) => a.author.name);
    if (names.length === 0) return "—";
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
  }

  function issueLabel(article: Article) {
    if (!article.issue) return "—";
    const { volume, number, year } = article.issue;
    return `Vol ${volume ?? "-"} No ${number ?? "-"}${year ? ` (${year})` : ""}`;
  }

  let thumbTarget: Article | null = null;
  let thumbUrl = "";
  let savingThumb = false;
  let mediaItems: MediaItem[] = [];
  let mediaLoading = false;

  async function openThumbDialog(article: Article) {
    thumbTarget = article;
    thumbUrl = article.thumbnailUrl ?? "";
    if (mediaItems.length === 0) {
      mediaLoading = true;
      try {
        mediaItems = await api.get<MediaItem[]>(`/journals/${journalId}/media`);
      } catch (err) {
        toastError(err, "Could not load media library");
      } finally {
        mediaLoading = false;
      }
    }
  }

  async function saveThumb() {
    if (!thumbTarget) return;
    savingThumb = true;
    try {
      await api.patch(`/articles/${thumbTarget.id}/thumbnail`, { thumbnailUrl: thumbUrl });
      const updated = { ...thumbTarget, thumbnailUrl: thumbUrl || null };
      articles = articles.map((a) => (a.id === updated.id ? updated : a));
      toasts.success("Thumbnail updated");
      thumbTarget = null;
    } catch (err) {
      toastError(err, "Could not save thumbnail");
    } finally {
      savingThumb = false;
    }
  }

  onMount(load);
  onDestroy(() => clearTimeout(debounce));
</script>

<div class="card">
  <div class="card-header">
    <div>
      <h2>Articles</h2>
      <p class="muted sub">Harvested from OJS via OAI-PMH — read-only in the publisher.</p>
    </div>
    <input
      class="search"
      type="search"
      bind:value={search}
      on:input={onSearchInput}
      placeholder="Search title or DOI…"
    />
  </div>

  {#if loading}
    <SkeletonRows rows={6} columns={5} />
  {:else if articles.length === 0}
    <EmptyState
      title={search ? "No matches" : "No articles yet"}
      message={search
        ? `Nothing matches “${search}”.`
        : "Run an OAI sync to harvest articles from the journal's OJS instance."}
    />
  {:else}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr><th></th><th>Title</th><th>Authors</th><th>Issue</th><th>Published</th><th></th></tr>
        </thead>
        <tbody>
          {#each articles as article (article.id)}
            <tr>
              <td>
                <button type="button" class="thumb-btn" on:click={() => openThumbDialog(article)} title="Set thumbnail">
                  {#if article.thumbnailUrl}
                    <img src={article.thumbnailUrl} alt="" />
                  {:else}
                    <span class="thumb-placeholder">+</span>
                  {/if}
                </button>
              </td>
              <td>
                <span class="title">{article.title}</span>
                {#if article.doi}<span class="doi mono">{article.doi}</span>{/if}
              </td>
              <td class="muted">{authorNames(article)}</td>
              <td class="muted">{issueLabel(article)}</td>
              <td class="muted">
                {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : "—"}
              </td>
              <td class="right">
                {#if article.url}
                  <a class="btn btn-secondary btn-sm" href={article.url} target="_blank" rel="noopener noreferrer">
                    OJS ↗
                  </a>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination {page} {pageSize} {total} on:change={onPageChange} />
  {/if}
</div>

{#if thumbTarget}
  <div class="dialog-scrim">
    <button type="button" class="dialog-hit" aria-label="Close" on:click={() => (thumbTarget = null)}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Set article thumbnail">
      <h3>Thumbnail</h3>
      <p class="dialog-subtitle">{thumbTarget.title}</p>

      {#if thumbUrl}
        <div class="thumb-preview">
          <img src={thumbUrl} alt="" />
          <button type="button" class="btn btn-ghost btn-sm remove-thumb" on:click={() => (thumbUrl = "")}>
            Remove
          </button>
        </div>
      {/if}

      {#if mediaLoading}
        <p class="muted">Loading media…</p>
      {:else if mediaItems.filter((m) => m.mimeType.startsWith("image/")).length > 0}
        <div class="media-grid">
          {#each mediaItems.filter((m) => m.mimeType.startsWith("image/")) as item (item.id)}
            <button type="button" class="media-item" on:click={() => (thumbUrl = item.url)}>
              <img src={item.url} alt={item.fileName} />
              <span>{item.fileName}</span>
            </button>
          {/each}
        </div>
      {/if}

      <div class="field">
        <label for="thumb-url">Image URL</label>
        <input id="thumb-url" bind:value={thumbUrl} placeholder="https://…/cover.jpg" />
      </div>

      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" on:click={() => (thumbTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={saveThumb} disabled={savingThumb}>
          {#if savingThumb}<span class="spinner"></span>{/if}
          {savingThumb ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .search {
    width: min(18rem, 100%);
  }
  .title {
    display: block;
    font-weight: 500;
    max-width: 32rem;
  }
  .doi {
    display: block;
    margin-top: 0.15rem;
    color: var(--fg-subtle);
    font-size: 0.75rem;
  }
  .right {
    text-align: right;
  }

  .thumb-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    cursor: pointer;
    overflow: hidden;
  }
  .thumb-btn:hover {
    border-color: var(--brand-500);
  }
  .thumb-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .thumb-placeholder {
    color: var(--fg-subtle);
    font-size: 1.1rem;
  }

  .dialog-scrim {
    position: fixed;
    inset: 0;
    z-index: 160;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .dialog-hit {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    border: none;
    cursor: default;
  }
  .dialog {
    position: relative;
    width: min(28rem, 100%);
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .dialog-subtitle {
    margin-top: -0.5rem;
    font-size: 0.8125rem;
    color: var(--fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .thumb-preview {
    position: relative;
  }
  .thumb-preview img {
    width: 100%;
    height: 8rem;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .remove-thumb {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    background: rgba(17, 24, 39, 0.65);
    color: #fff;
  }
  .remove-thumb:hover {
    background: rgba(17, 24, 39, 0.85);
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
    gap: 0.5rem;
    max-height: 12rem;
    overflow-y: auto;
    padding: 0.15rem;
  }
  .media-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.3rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--fg-muted);
    text-align: left;
  }
  .media-item:hover {
    border-color: var(--brand-500);
  }
  .media-item img {
    width: 100%;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.2rem;
  }
  .media-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
