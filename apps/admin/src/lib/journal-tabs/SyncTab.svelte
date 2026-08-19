<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface SyncRun {
    id: string;
    status: string;
    fromDate: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
  }

  let runs: SyncRun[] = [];
  let syncing = false;
  let error = "";

  async function load() {
    try {
      runs = await api.get<SyncRun[]>(`/journals/${journalId}/sync/runs`);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function syncNow() {
    syncing = true;
    error = "";
    try {
      await api.post(`/journals/${journalId}/sync`);
      await load();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      syncing = false;
    }
  }

  onMount(load);
</script>

<h2>OAI Synchronization</h2>
{#if error}<p class="error">{error}</p>{/if}

<button on:click={syncNow} disabled={syncing}>{syncing ? "Queuing..." : "Sync Now"}</button>

<table>
  <thead>
    <tr><th>Status</th><th>From</th><th>Started</th><th>Finished</th><th>Error</th></tr>
  </thead>
  <tbody>
    {#each runs as run (run.id)}
      <tr>
        <td>{run.status}</td>
        <td>{run.fromDate ? new Date(run.fromDate).toLocaleString() : "(full)"}</td>
        <td>{run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}</td>
        <td>{run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "-"}</td>
        <td class="error">{run.errorMessage ?? ""}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  button {
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
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
    font-size: 0.875rem;
  }
  .error {
    color: #dc2626;
  }
</style>
