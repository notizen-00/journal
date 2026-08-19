<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface Build {
    id: string;
    status: string;
    pagesCount: number | null;
    assetsCount: number | null;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
  }

  let builds: Build[] = [];
  let building = false;
  let error = "";

  async function load() {
    try {
      builds = await api.get<Build[]>(`/journals/${journalId}/builds`);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function triggerBuild() {
    building = true;
    error = "";
    try {
      await api.post(`/journals/${journalId}/build`);
      await load();
    } catch (err) {
      error = (err as Error).message;
    } finally {
      building = false;
    }
  }

  async function retry(id: string) {
    await api.post(`/builds/${id}/retry`);
    await load();
  }

  async function rollback(id: string) {
    await api.post(`/builds/${id}/rollback`);
    await load();
  }

  onMount(load);
</script>

<h2>Builds</h2>
{#if error}<p class="error">{error}</p>{/if}

<button on:click={triggerBuild} disabled={building}>{building ? "Queuing..." : "Build now"}</button>

<table>
  <thead>
    <tr><th>Status</th><th>Pages</th><th>Assets</th><th>Started</th><th>Finished</th><th></th></tr>
  </thead>
  <tbody>
    {#each builds as build (build.id)}
      <tr>
        <td>{build.status}</td>
        <td>{build.pagesCount ?? "-"}</td>
        <td>{build.assetsCount ?? "-"}</td>
        <td>{build.startedAt ? new Date(build.startedAt).toLocaleString() : "-"}</td>
        <td>{build.finishedAt ? new Date(build.finishedAt).toLocaleString() : "-"}</td>
        <td class="actions">
          {#if build.status === "FAILED"}
            <button on:click={() => retry(build.id)}>Retry</button>
          {/if}
          {#if build.status === "SUCCESS"}
            <button on:click={() => rollback(build.id)}>Rollback to this</button>
          {/if}
        </td>
      </tr>
      {#if build.errorMessage}
        <tr><td colspan="6" class="error">{build.errorMessage}</td></tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  button {
    margin-bottom: 1rem;
    padding: 0.4rem 0.8rem;
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
  .actions button {
    margin: 0;
  }
  .error {
    color: #dc2626;
  }
</style>
