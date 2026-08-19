<script lang="ts">
  import { onMount } from "svelte";
  import type { Readable } from "svelte/store";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import type { RealtimeStore } from "$lib/realtime";
  import StatusPill from "$lib/components/StatusPill.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SkeletonRows from "$lib/components/SkeletonRows.svelte";

  export let journalId: string;
  export let live: Readable<RealtimeStore>;

  interface SyncRun {
    id: string;
    status: string;
    fromDate: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
  }

  let runs: SyncRun[] = [];
  let loading = true;
  let syncing = false;

  let page = 1;
  let pageSize = 10;
  $: paged = runs.slice((page - 1) * pageSize, page * pageSize);

  $: liveSync = $live.snapshot?.sync ?? null;
  $: busy = liveSync?.status === "RUNNING" || liveSync?.status === "PENDING";

  // The realtime feed reports the *latest* run's state; when it settles, pull
  // the full history again so the table below reflects the finished run.
  let lastSeenState = "";
  $: if (liveSync) {
    const state = `${liveSync.id}:${liveSync.status}`;
    if (state !== lastSeenState) {
      lastSeenState = state;
      void load();
      if (liveSync.status === "SUCCESS" && liveSync.errorMessage && runs.length > 0) {
        // One of several configured sources failed — worth a warning even
        // though the run technically "succeeded".
        toasts.error(liveSync.errorMessage);
      } else if (liveSync.status === "SUCCESS" && runs.length > 0) {
        toasts.success(`Harvest finished — ${liveSync.processed} records processed`);
      } else if (liveSync.status === "FAILED" && runs.length > 0) {
        toasts.error(liveSync.errorMessage ?? "Harvest failed");
      }
    }
  }

  /** SUCCESS-with-errorMessage means one of several sources failed. */
  function displayStatus(run: { status: string; errorMessage: string | null }) {
    return run.status === "SUCCESS" && run.errorMessage ? "PARTIAL" : run.status;
  }

  async function load() {
    try {
      runs = await api.get<SyncRun[]>(`/journals/${journalId}/sync/runs`);
    } catch (err) {
      toastError(err, "Could not load sync history");
    } finally {
      loading = false;
    }
  }

  async function syncNow() {
    syncing = true;
    try {
      await api.post(`/journals/${journalId}/sync`);
      toasts.info("Harvest queued");
      await load();
    } catch (err) {
      toastError(err, "Could not queue sync");
    } finally {
      syncing = false;
    }
  }

  function fmt(iso: string | null) {
    return iso ? new Date(iso).toLocaleString() : "—";
  }

  function duration(run: SyncRun) {
    if (!run.startedAt) return "—";
    const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((end - new Date(run.startedAt).getTime()) / 1000));
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  onMount(load);
</script>

{#if busy && liveSync}
  <div class="card running">
    <div class="card-body">
      <div class="running-head">
        <span class="live-dot"></span>
        <strong>Harvest in progress</strong>
        <StatusPill status={liveSync.status} />
      </div>
      <p class="running-detail">
        {liveSync.processed} record{liveSync.processed === 1 ? "" : "s"} processed
        {#if liveSync.failed > 0}<span class="fail"> · {liveSync.failed} failed</span>{/if}
      </p>
      <div class="bar"><div class="bar-fill"></div></div>
      <p class="muted hint">
        OAI-PMH does not report a total up front, so this shows records completed rather than a percentage.
      </p>
    </div>
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <div>
      <h2>OAI Synchronization</h2>
      <p class="muted sub">Harvests new and changed records from the journal's OAI-PMH endpoint.</p>
    </div>
    <button class="btn btn-primary" on:click={syncNow} disabled={syncing || busy}>
      {#if syncing || busy}<span class="spinner"></span>{/if}
      {busy ? "Running…" : syncing ? "Queuing…" : "Sync now"}
    </button>
  </div>

  {#if loading}
    <SkeletonRows rows={4} columns={5} />
  {:else if runs.length === 0}
    <EmptyState title="No sync runs yet" message="Run a harvest to pull articles from OJS." />
  {:else}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Status</th><th>Range from</th><th>Started</th><th>Duration</th><th>Error</th></tr>
        </thead>
        <tbody>
          {#each paged as run (run.id)}
            <tr>
              <td><StatusPill status={displayStatus(run)} /></td>
              <td class="muted">{run.fromDate ? fmt(run.fromDate) : "Full harvest"}</td>
              <td class="muted">{fmt(run.startedAt)}</td>
              <td class="muted">{duration(run)}</td>
              <td class="err">{run.errorMessage ?? ""}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination {page} {pageSize} total={runs.length} on:change={(e) => ({ page, pageSize } = e.detail)} />
  {/if}
</div>

<style>
  .running {
    margin-bottom: 1rem;
    border-color: var(--brand-200);
    background: var(--brand-50);
  }
  .running-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--brand-700);
  }
  .running-detail {
    margin-top: 0.4rem;
    font-size: 0.875rem;
  }
  .fail {
    color: var(--danger);
  }
  .bar {
    margin-top: 0.65rem;
    height: 0.3rem;
    border-radius: 999px;
    background: var(--brand-100);
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    width: 35%;
    border-radius: 999px;
    background: var(--brand-600);
    animation: slide 1.4s ease-in-out infinite;
  }
  @keyframes slide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(320%);
    }
  }
  .hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
  }
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .err {
    color: var(--danger);
    font-size: 0.8125rem;
    max-width: 20rem;
    overflow-wrap: anywhere;
  }
</style>
