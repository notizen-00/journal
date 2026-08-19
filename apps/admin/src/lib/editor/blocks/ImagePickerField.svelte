<script lang="ts">
  import { api } from "$lib/api";
  import { toastError } from "$lib/toast";

  export let value = "";
  export let journalId: string;
  export let label = "Image";
  export let placeholder = "https://…/image.jpg";

  interface MediaItem {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
  }

  let showPicker = false;
  let mediaItems: MediaItem[] = [];
  let mediaLoading = false;

  async function openPicker() {
    showPicker = true;
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

  function pick(url: string) {
    value = url;
    showPicker = false;
  }

  const uid = `img-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="field">
  <label for={uid}>{label}</label>
  {#if value}
    <div class="preview">
      <img src={value} alt="" />
      <button type="button" class="btn btn-ghost btn-sm remove" on:click={() => (value = "")}>✕</button>
    </div>
  {/if}
  <div class="row">
    <input id={uid} bind:value {placeholder} />
    <button type="button" class="btn btn-secondary btn-sm" on:click={openPicker}>Choose…</button>
  </div>
</div>

{#if showPicker}
  <div class="dialog-scrim">
    <button type="button" class="dialog-hit" aria-label="Close" on:click={() => (showPicker = false)}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Choose image">
      <h3>Choose image</h3>
      {#if mediaLoading}
        <p class="muted">Loading media…</p>
      {:else if mediaItems.filter((m) => m.mimeType.startsWith("image/")).length === 0}
        <p class="muted">No images in the media library yet — upload one from the Media tab.</p>
      {:else}
        <div class="media-grid">
          {#each mediaItems.filter((m) => m.mimeType.startsWith("image/")) as item (item.id)}
            <button type="button" class="media-item" on:click={() => pick(item.url)}>
              <img src={item.url} alt={item.fileName} />
              <span>{item.fileName}</span>
            </button>
          {/each}
        </div>
      {/if}
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" on:click={() => (showPicker = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .row {
    display: flex;
    gap: 0.5rem;
  }
  .preview {
    position: relative;
    margin-bottom: 0.4rem;
  }
  .preview img {
    width: 100%;
    height: 6rem;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .remove {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
    background: rgba(17, 24, 39, 0.65);
    color: #fff;
  }
  .remove:hover {
    background: rgba(17, 24, 39, 0.85);
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
    width: min(30rem, 100%);
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: 0.5rem;
    max-height: 18rem;
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
    height: 4.5rem;
    object-fit: cover;
    border-radius: 0.2rem;
  }
  .media-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
