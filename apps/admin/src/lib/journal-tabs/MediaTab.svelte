<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface Media {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
    size: number;
  }

  let media: Media[] = [];
  let uploading = false;
  let error = "";

  async function load() {
    try {
      media = await api.get<Media[]>(`/journals/${journalId}/media`);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uploading = true;
    error = "";
    try {
      await api.upload(`/journals/${journalId}/media`, file);
      await load();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      uploading = false;
    }
  }

  async function remove(id: string) {
    await api.del(`/media/${id}`);
    await load();
  }

  onMount(load);
</script>

<h2>Media</h2>
{#if error}<p class="error">{error}</p>{/if}

<input type="file" on:change={onFileChange} disabled={uploading} />

<div class="grid">
  {#each media as item (item.id)}
    <div class="card">
      {#if item.mimeType.startsWith("image/")}
        <img src={item.url} alt={item.fileName} />
      {/if}
      <p class="name">{item.fileName}</p>
      <button on:click={() => remove(item.id)}>Delete</button>
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem;
  }
  .card img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 0.25rem;
  }
  .name {
    font-size: 0.75rem;
    word-break: break-all;
  }
  button {
    width: 100%;
    padding: 0.3rem;
    border: none;
    border-radius: 0.25rem;
    background: #dc2626;
    color: #fff;
    cursor: pointer;
  }
  .error {
    color: #dc2626;
  }
</style>
