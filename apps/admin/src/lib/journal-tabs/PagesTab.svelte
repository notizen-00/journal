<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import StatusPill from "$lib/components/StatusPill.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SkeletonRows from "$lib/components/SkeletonRows.svelte";

  export let journalId: string;

  interface Page {
    id: string;
    slug: string;
    title: string;
    status: string;
    updatedAt?: string;
  }

  let pages: Page[] = [];
  let loading = true;
  let creating = false;
  let showForm = false;
  let form = { slug: "", title: "" };

  let search = "";
  let page = 1;
  let pageSize = 10;

  $: filtered = pages.filter((p) =>
    `${p.title} ${p.slug}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  $: if (search !== undefined) page = 1;
  $: paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Keep the slug in step with the title until the user edits it themselves.
  let slugTouched = false;
  $: if (!slugTouched) {
    form.slug = form.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function load() {
    loading = true;
    try {
      pages = await api.get<Page[]>(`/journals/${journalId}/pages`);
    } catch (err) {
      toastError(err, "Could not load pages");
    } finally {
      loading = false;
    }
  }

  async function createPage() {
    creating = true;
    try {
      await api.post(`/journals/${journalId}/pages`, {
        slug: form.slug,
        title: form.title,
        blocks: [],
      });
      toasts.success(`Page "${form.title}" created`);
      form = { slug: "", title: "" };
      slugTouched = false;
      showForm = false;
      await load();
    } catch (err) {
      toastError(err, "Could not create page");
    } finally {
      creating = false;
    }
  }

  onMount(load);
</script>

<div class="card">
  <div class="card-header">
    <div>
      <h2>Pages</h2>
      <p class="muted sub">CMS pages rendered into the static site.</p>
    </div>
    <div class="toolbar">
      <input class="search" type="search" bind:value={search} placeholder="Search pages…" />
      <button class="btn btn-primary" on:click={() => (showForm = !showForm)}>
        {showForm ? "Cancel" : "+ New page"}
      </button>
    </div>
  </div>

  {#if showForm}
    <form class="card-body new-form" on:submit|preventDefault={createPage}>
      <div class="field">
        <label for="p-title">Title *</label>
        <input id="p-title" bind:value={form.title} required placeholder="Author Guidelines" />
      </div>
      <div class="field">
        <label for="p-slug">Slug *</label>
        <input
          id="p-slug"
          bind:value={form.slug}
          on:input={() => (slugTouched = true)}
          required
          placeholder="author-guidelines"
        />
        <span class="field-hint">Published at /{form.slug || "…"}/</span>
      </div>
      <div class="new-actions">
        <button type="submit" class="btn btn-primary" disabled={creating}>
          {#if creating}<span class="spinner"></span>{/if}
          {creating ? "Creating…" : "Create page"}
        </button>
      </div>
    </form>
  {/if}

  {#if loading}
    <SkeletonRows rows={5} columns={4} />
  {:else if filtered.length === 0}
    <EmptyState
      title={pages.length === 0 ? "No pages yet" : "No matches"}
      message={pages.length === 0
        ? "Create a page to add content beyond the harvested articles."
        : `Nothing matches “${search}”.`}
    />
  {:else}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Title</th><th>Slug</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {#each paged as item (item.id)}
            <tr>
              <td>
                <a class="title" href={`/journals/${journalId}/pages/${item.id}`}>{item.title}</a>
              </td>
              <td class="muted mono">/{item.slug}</td>
              <td><StatusPill status={item.status} /></td>
              <td class="right">
                <a class="btn btn-secondary btn-sm" href={`/journals/${journalId}/pages/${item.id}`}>Edit</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination {page} {pageSize} total={filtered.length} on:change={(e) => ({ page, pageSize } = e.detail)} />
  {/if}
</div>

<style>
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .search {
    width: min(14rem, 100%);
  }
  .new-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  .new-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
  .title {
    font-weight: 500;
    color: var(--fg);
    text-decoration: none;
  }
  .title:hover {
    color: var(--brand-600);
  }
  .right {
    text-align: right;
  }
  @media (max-width: 640px) {
    .new-form {
      grid-template-columns: 1fr;
    }
  }
</style>
