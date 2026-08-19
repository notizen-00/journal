<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  export let journalId: string;

  interface Media {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }

  let media: Media[] = [];
  let loading = true;
  let uploading = false;
  let dragOver = false;
  let deleteTarget: Media | null = null;

  let page = 1;
  let pageSize = 20;
  $: paged = media.slice((page - 1) * pageSize, page * pageSize);

  async function load() {
    loading = true;
    try {
      media = await api.get<Media[]>(`/journals/${journalId}/media`);
    } catch (err) {
      toastError(err, "Could not load media");
    } finally {
      loading = false;
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    uploading = true;
    let succeeded = 0;
    try {
      for (const file of list) {
        try {
          await api.upload(`/journals/${journalId}/media`, file);
          succeeded++;
        } catch (err) {
          toastError(err, `Could not upload ${file.name}`);
        }
      }
      if (succeeded > 0) {
        toasts.success(`Uploaded ${succeeded} file${succeeded === 1 ? "" : "s"}`);
        await load();
      }
    } finally {
      uploading = false;
    }
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) void uploadFiles(input.files);
    input.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files) void uploadFiles(e.dataTransfer.files);
  }

  async function confirmDelete() {
    const target = deleteTarget;
    deleteTarget = null;
    if (!target) return;
    try {
      await api.del(`/media/${target.id}`);
      toasts.success(`Deleted ${target.fileName}`);
      await load();
    } catch (err) {
      toastError(err, "Could not delete file");
    }
  }

  async function copyUrl(item: Media) {
    try {
      await navigator.clipboard.writeText(item.url);
      toasts.success("URL copied to clipboard");
    } catch {
      toasts.error("Could not access the clipboard");
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  onMount(load);
</script>

<div class="card">
  <div class="card-header">
    <div>
      <h2>Media</h2>
      <p class="muted sub">Images and files owned by this journal, stored separately from OJS.</p>
    </div>
  </div>

  <div class="card-body">
    <div
      class="dropzone"
      class:drag={dragOver}
      role="button"
      tabindex="0"
      on:dragover|preventDefault={() => (dragOver = true)}
      on:dragleave={() => (dragOver = false)}
      on:drop={onDrop}
    >
      {#if uploading}
        <span class="spinner"></span>
        <span>Uploading…</span>
      {:else}
        <strong>Drop files here</strong>
        <span class="muted">or</span>
        <label class="btn btn-secondary btn-sm file-label">
          Choose files
          <input type="file" multiple on:change={onFileChange} disabled={uploading} />
        </label>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="card-body"><p class="muted">Loading media…</p></div>
  {:else if media.length === 0}
    <EmptyState title="No media yet" message="Upload images to use in pages and the journal logo." />
  {:else}
    <div class="card-body grid">
      {#each paged as item (item.id)}
        <div class="media-card">
          <div class="thumb">
            {#if item.mimeType.startsWith("image/")}
              <img src={item.url} alt={item.fileName} loading="lazy" />
            {:else}
              <span class="file-icon">{item.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}</span>
            {/if}
          </div>
          <p class="name" title={item.fileName}>{item.fileName}</p>
          <p class="meta muted">{formatSize(item.size)}</p>
          <div class="media-actions">
            <button class="btn btn-secondary btn-sm" on:click={() => copyUrl(item)}>Copy URL</button>
            <button class="btn btn-ghost btn-sm danger" on:click={() => (deleteTarget = item)}>Delete</button>
          </div>
        </div>
      {/each}
    </div>
    <Pagination
      {page}
      {pageSize}
      total={media.length}
      pageSizeOptions={[12, 20, 40]}
      on:change={(e) => ({ page, pageSize } = e.detail)}
    />
  {/if}
</div>

<ConfirmDialog
  open={deleteTarget !== null}
  title="Delete this file?"
  message={`"${deleteTarget?.fileName ?? ""}" will be removed permanently. Pages still referencing it will show a broken image.`}
  confirmLabel="Delete"
  danger
  on:confirm={confirmDelete}
  on:cancel={() => (deleteTarget = null)}
/>

<style>
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1.75rem 1rem;
    border: 2px dashed var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 0.875rem;
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .dropzone.drag {
    border-color: var(--brand-500);
    background: var(--brand-50);
  }
  .file-label {
    position: relative;
    overflow: hidden;
  }
  .file-label input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    padding: 0;
    border: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 1rem;
    padding-top: 0;
  }
  .media-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem;
    background: var(--surface);
  }
  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 7rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    overflow: hidden;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .file-icon {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--fg-muted);
    letter-spacing: 0.05em;
  }
  .name {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    font-size: 0.75rem;
  }
  .media-actions {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }
  .media-actions .btn {
    flex: 1;
  }
  .danger {
    color: var(--danger);
  }
</style>
