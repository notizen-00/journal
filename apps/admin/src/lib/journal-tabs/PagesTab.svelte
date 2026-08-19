<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface Page {
    id: string;
    slug: string;
    title: string;
    status: string;
  }

  let pages: Page[] = [];
  let slug = "";
  let title = "";
  let loading = true;
  let error = "";

  async function load() {
    loading = true;
    try {
      pages = await api.get<Page[]>(`/journals/${journalId}/pages`);
    } catch (err) {
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  async function createPage() {
    try {
      await api.post(`/journals/${journalId}/pages`, { slug, title, blocks: [] });
      slug = title = "";
      await load();
    } catch (err) {
      error = (err as Error).message;
    }
  }

  onMount(load);
</script>

<h2>Pages</h2>
{#if error}<p class="error">{error}</p>{/if}

<form on:submit|preventDefault={createPage} class="inline-form">
  <input placeholder="slug (e.g. home, about)" bind:value={slug} required />
  <input placeholder="Title" bind:value={title} required />
  <button type="submit">Add page</button>
</form>

{#if loading}
  <p>Loading...</p>
{:else}
  <ul class="items">
    {#each pages as page (page.id)}
      <li>
        <a href={`/journals/${journalId}/pages/${page.id}`}>{page.title}</a>
        <span class="muted">/{page.slug}</span>
        <span class="status">{page.status}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .inline-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
  }
  .items {
    list-style: none;
    padding: 0;
  }
  .items li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .muted {
    color: #6b7280;
  }
  .status {
    margin-left: auto;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
  }
  .error {
    color: #dc2626;
  }
</style>
