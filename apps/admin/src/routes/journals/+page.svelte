<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { getBreadcrumbs } from "$lib/ui";

  const breadcrumbs = getBreadcrumbs();
  import { toasts, toastError } from "$lib/toast";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SkeletonRows from "$lib/components/SkeletonRows.svelte";
  import StatusPill from "$lib/components/StatusPill.svelte";
  import Pagination from "$lib/components/Pagination.svelte";

  // No clear-on-destroy: every route sets its own full breadcrumb trail
  // unconditionally, so there's nothing for a stale value to leak from —
  // and during SSR, onDestroy fires synchronously right after this
  // component renders (there's no persistent instance), which would wipe
  // the store before the layout's header ever reads it.
  breadcrumbs.set([{ label: "Journals" }]);

  interface Journal {
    id: string;
    name: string;
    acronym: string | null;
    domain: string | null;
    status: string;
  }

  let journals: Journal[] = [];
  let loading = true;

  let showForm = false;
  let showSecondSource = false;
  let creating = false;
  let form = {
    name: "",
    acronym: "",
    domain: "",
    ojsUrl: "",
    oaiEndpoint: "",
    ojsUrl2: "",
    oaiEndpoint2: "",
  };

  let search = "";
  let page = 1;
  let pageSize = 10;

  $: filtered = journals.filter((j) =>
    `${j.name} ${j.acronym ?? ""} ${j.domain ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  // Reset to the first page whenever the filter changes the result set.
  $: if (search !== undefined) page = 1;
  $: paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function load() {
    loading = true;
    try {
      journals = await api.get<Journal[]>("/journals");
    } catch (err) {
      toastError(err, "Could not load journals");
    } finally {
      loading = false;
    }
  }

  async function createJournal() {
    creating = true;
    try {
      await api.post("/journals", {
        name: form.name,
        acronym: form.acronym || undefined,
        domain: form.domain || undefined,
        source:
          form.ojsUrl && form.oaiEndpoint
            ? {
                ojsUrl: form.ojsUrl,
                oaiEndpoint: form.oaiEndpoint,
                ojsUrl2: form.ojsUrl2 || undefined,
                oaiEndpoint2: form.oaiEndpoint2 || undefined,
              }
            : undefined,
      });
      toasts.success(`Journal "${form.name}" created`);
      form = { name: "", acronym: "", domain: "", ojsUrl: "", oaiEndpoint: "", ojsUrl2: "", oaiEndpoint2: "" };
      showSecondSource = false;
      showForm = false;
      await load();
    } catch (err) {
      toastError(err, "Could not create journal");
    } finally {
      creating = false;
    }
  }

  onMount(load);
</script>

<svelte:head><title>Journals · Journal Publisher</title></svelte:head>

<div class="page-head">
  <p class="muted">Manage every journal this instance publishes.</p>
  <button class="btn btn-primary" on:click={() => (showForm = !showForm)}>
    {showForm ? "Cancel" : "+ New journal"}
  </button>
</div>

{#if showForm}
  <div class="card create-card">
    <div class="card-header"><h2>New journal</h2></div>
    <form class="card-body form-grid" on:submit|preventDefault={createJournal}>
      <div class="field">
        <label for="j-name">Name *</label>
        <input id="j-name" bind:value={form.name} required placeholder="Jurnal Agroteknologi" />
      </div>
      <div class="field">
        <label for="j-acronym">Acronym</label>
        <input id="j-acronym" bind:value={form.acronym} placeholder="J-AGT" />
      </div>
      <div class="field">
        <label for="j-domain">Domain</label>
        <input id="j-domain" bind:value={form.domain} placeholder="jagt.unej.ac.id" />
      </div>
      <div class="field">
        <label for="j-ojs">OJS URL</label>
        <input id="j-ojs" bind:value={form.ojsUrl} placeholder="https://jurnal.unej.ac.id/index.php" />
      </div>
      <div class="field span-2">
        <label for="j-oai">OAI endpoint</label>
        <input id="j-oai" bind:value={form.oaiEndpoint} placeholder="https://…/index.php/XXX/oai" />
        <span class="field-hint">Both OJS URL and OAI endpoint are needed to enable harvesting.</span>
      </div>

      <div class="span-2">
        {#if showSecondSource}
          <div class="second-source">
            <div class="second-source-head">
              <span class="field-hint strong">Second source (e.g. an old site the journal migrated from)</span>
              <button type="button" class="btn btn-ghost btn-sm" on:click={() => (showSecondSource = false)}>
                Remove
              </button>
            </div>
            <div class="form-grid">
              <div class="field">
                <label for="j-ojs2">Old OJS URL</label>
                <input id="j-ojs2" bind:value={form.ojsUrl2} placeholder="https://old.example.ac.id/index.php" />
              </div>
              <div class="field">
                <label for="j-oai2">Old OAI endpoint</label>
                <input id="j-oai2" bind:value={form.oaiEndpoint2} placeholder="https://old…/index.php/XXX/oai" />
              </div>
            </div>
          </div>
        {:else}
          <button type="button" class="btn btn-secondary btn-sm" on:click={() => (showSecondSource = true)}>
            + Add a second OAI source
          </button>
        {/if}
      </div>

      <div class="form-actions span-2">
        <button type="button" class="btn btn-secondary" on:click={() => (showForm = false)}>Cancel</button>
        <button type="submit" class="btn btn-primary" disabled={creating}>
          {#if creating}<span class="spinner"></span>{/if}
          {creating ? "Creating…" : "Create journal"}
        </button>
      </div>
    </form>
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <h2>All journals</h2>
    <input class="search" type="search" bind:value={search} placeholder="Search journals…" />
  </div>

  {#if loading}
    <SkeletonRows rows={4} columns={4} />
  {:else if filtered.length === 0}
    <EmptyState
      title={journals.length === 0 ? "No journals yet" : "No matches"}
      message={journals.length === 0
        ? "Create your first journal to start publishing."
        : `Nothing matches “${search}”.`}
    />
  {:else}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Name</th><th>Domain</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {#each paged as journal (journal.id)}
            <tr>
              <td>
                <a class="journal-name" href={`/journals/${journal.id}`}>{journal.name}</a>
                {#if journal.acronym}<span class="muted"> ({journal.acronym})</span>{/if}
              </td>
              <td class="muted">{journal.domain ?? "—"}</td>
              <td><StatusPill status={journal.status} /></td>
              <td class="right">
                <a class="btn btn-secondary btn-sm" href={`/journals/${journal.id}`}>Manage</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination
      {page}
      {pageSize}
      total={filtered.length}
      pageSizeOptions={[10, 25, 50]}
      on:change={(e) => ({ page, pageSize } = e.detail)}
    />
  {/if}
</div>

<style>
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }
  .page-head p {
    font-size: 0.875rem;
  }
  .create-card {
    margin-bottom: 1.25rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .span-2 {
    grid-column: 1 / -1;
  }
  .second-source {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .second-source-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .field-hint.strong {
    font-weight: 600;
    color: var(--fg);
  }
  .second-source .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .search {
    width: min(18rem, 100%);
  }
  .journal-name {
    font-weight: 550;
    color: var(--fg);
    text-decoration: none;
  }
  .journal-name:hover {
    color: var(--brand-600);
  }
  .right {
    text-align: right;
  }
  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
