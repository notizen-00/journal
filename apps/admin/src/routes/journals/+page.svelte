<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  interface Journal {
    id: string;
    name: string;
    acronym: string | null;
    domain: string | null;
    status: string;
  }

  let journals: Journal[] = [];
  let loading = true;
  let error = "";

  let name = "";
  let acronym = "";
  let domain = "";
  let ojsUrl = "";
  let oaiEndpoint = "";
  let creating = false;

  async function loadJournals() {
    loading = true;
    try {
      journals = await api.get<Journal[]>("/journals");
    } catch (err) {
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  async function createJournal() {
    creating = true;
    error = "";
    try {
      await api.post("/journals", {
        name,
        acronym: acronym || undefined,
        domain: domain || undefined,
        source: ojsUrl && oaiEndpoint ? { ojsUrl, oaiEndpoint } : undefined,
      });
      name = acronym = domain = ojsUrl = oaiEndpoint = "";
      await loadJournals();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      creating = false;
    }
  }

  onMount(loadJournals);
</script>

<h1>Journals</h1>
{#if error}<p class="error">{error}</p>{/if}

<section class="create">
  <h2>New journal</h2>
  <form on:submit|preventDefault={createJournal}>
    <input placeholder="Name" bind:value={name} required />
    <input placeholder="Acronym" bind:value={acronym} />
    <input placeholder="Domain (e.g. journal-a.unej.ac.id)" bind:value={domain} />
    <input placeholder="OJS URL" bind:value={ojsUrl} />
    <input placeholder="OAI endpoint" bind:value={oaiEndpoint} />
    <button type="submit" disabled={creating}>{creating ? "Creating..." : "Create journal"}</button>
  </form>
</section>

<section class="list">
  {#if loading}
    <p>Loading...</p>
  {:else}
    <table>
      <thead>
        <tr><th>Name</th><th>Domain</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        {#each journals as journal (journal.id)}
          <tr>
            <td>{journal.name} {#if journal.acronym}<span class="muted">({journal.acronym})</span>{/if}</td>
            <td>{journal.domain ?? "-"}</td>
            <td>{journal.status}</td>
            <td><a href={`/journals/${journal.id}`}>Manage</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .create form {
    display: grid;
    grid-template-columns: repeat(2, minmax(200px, 1fr));
    gap: 0.5rem;
    max-width: 700px;
    margin-bottom: 2rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  button {
    grid-column: 1 / -1;
    padding: 0.6rem;
    border: none;
    border-radius: 0.375rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
    width: fit-content;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  .muted {
    color: #6b7280;
  }
  .error {
    color: #dc2626;
  }
</style>
