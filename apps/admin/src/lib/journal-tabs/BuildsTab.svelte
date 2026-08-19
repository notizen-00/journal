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
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  export let journalId: string;
  export let live: Readable<RealtimeStore>;

  interface Build {
    id: string;
    status: string;
    pagesCount: number | null;
    assetsCount: number | null;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    deployment?: { status: string } | null;
  }

  let builds: Build[] = [];
  let loading = true;
  let queuing = false;

  let page = 1;
  let pageSize = 10;
  $: paged = builds.slice((page - 1) * pageSize, page * pageSize);

  let rollbackTarget: Build | null = null;

  $: liveBuild = $live.snapshot?.builds[0] ?? null;
  $: busy = liveBuild?.status === "RUNNING" || liveBuild?.status === "PENDING";

  // Refresh the table whenever the realtime feed reports the newest build
  // changed state, so counts and rollback affordances stay accurate.
  let lastSeenState = "";
  $: if (liveBuild) {
    const state = `${liveBuild.id}:${liveBuild.status}`;
    if (state !== lastSeenState) {
      const hadPrevious = lastSeenState !== "";
      lastSeenState = state;
      void load();
      if (hadPrevious && liveBuild.status === "SUCCESS") {
        toasts.success(`Build finished — ${liveBuild.pagesCount ?? 0} pages published`);
      } else if (hadPrevious && liveBuild.status === "FAILED") {
        toasts.error(liveBuild.errorMessage ?? "Build failed");
      }
    }
  }

  async function load() {
    try {
      builds = await api.get<Build[]>(`/journals/${journalId}/builds`);
    } catch (err) {
      toastError(err, "Could not load builds");
    } finally {
      loading = false;
    }
  }

  async function triggerBuild() {
    queuing = true;
    try {
      await api.post(`/journals/${journalId}/build`);
      toasts.info("Build queued");
      await load();
    } catch (err) {
      toastError(err, "Could not queue build");
    } finally {
      queuing = false;
    }
  }

  async function retry(build: Build) {
    try {
      await api.post(`/builds/${build.id}/retry`);
      toasts.info("Retry queued as a new build");
      await load();
    } catch (err) {
      toastError(err, "Could not retry build");
    }
  }

  async function confirmRollback() {
    const target = rollbackTarget;
    rollbackTarget = null;
    if (!target) return;
    try {
      await api.post(`/builds/${target.id}/rollback`);
      toasts.success("Rollback queued — the previous release will go live");
      await load();
    } catch (err) {
      toastError(err, "Could not roll back");
    }
  }

  function fmt(iso: string | null) {
    return iso ? new Date(iso).toLocaleString() : "—";
  }

  function duration(build: Build) {
    if (!build.startedAt) return "—";
    const end = build.finishedAt ? new Date(build.finishedAt).getTime() : Date.now();
    const seconds = Math.max(0, Math.round((end - new Date(build.startedAt).getTime()) / 1000));
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  onMount(load);
</script>

{#if busy && liveBuild}
  <div class="card running">
    <div class="card-body">
      <div class="running-head">
        <span class="live-dot"></span>
        <strong>Build in progress</strong>
        <StatusPill status={liveBuild.status} />
      </div>
      <p class="muted running-detail">
        Rendering the static site. The current release stays live until this build succeeds.
      </p>
      <div class="bar"><div class="bar-fill"></div></div>
    </div>
  </div>
{/if}

<div class="card">
  <div class="card-header">
    <div>
      <h2>Builds</h2>
      <p class="muted sub">Each build renders the site and atomically swaps the live release.</p>
    </div>
    <button class="btn btn-primary" on:click={triggerBuild} disabled={queuing || busy}>
      {#if queuing || busy}<span class="spinner"></span>{/if}
      {busy ? "Building…" : queuing ? "Queuing…" : "Build now"}
    </button>
  </div>

  {#if loading}
    <SkeletonRows rows={4} columns={6} />
  {:else if builds.length === 0}
    <EmptyState title="No builds yet" message="Run a build to publish the static site." />
  {:else}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr><th>Status</th><th>Pages</th><th>Assets</th><th>Started</th><th>Duration</th><th></th></tr>
        </thead>
        <tbody>
          {#each paged as build (build.id)}
            <tr>
              <td>
                <div class="status-cell">
                  <StatusPill status={build.status} />
                  {#if build.deployment?.status === "ACTIVE"}
                    <span class="pill pill-info">Live</span>
                  {/if}
                </div>
                {#if build.errorMessage}
                  <p class="err">{build.errorMessage}</p>
                {/if}
              </td>
              <td class="muted">{build.pagesCount ?? "—"}</td>
              <td class="muted">{build.assetsCount ?? "—"}</td>
              <td class="muted">{fmt(build.startedAt)}</td>
              <td class="muted">{duration(build)}</td>
              <td class="right">
                {#if build.status === "FAILED"}
                  <button class="btn btn-secondary btn-sm" on:click={() => retry(build)}>Retry</button>
                {:else if build.status === "SUCCESS" && build.deployment?.status !== "ACTIVE"}
                  <button class="btn btn-secondary btn-sm" on:click={() => (rollbackTarget = build)}>
                    Roll back to this
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination {page} {pageSize} total={builds.length} on:change={(e) => ({ page, pageSize } = e.detail)} />
  {/if}
</div>

<ConfirmDialog
  open={rollbackTarget !== null}
  title="Roll back to this build?"
  message="The live site will immediately serve this older release. No rebuild happens, so any content published since then disappears until the next build."
  confirmLabel="Roll back"
  danger
  on:confirm={confirmRollback}
  on:cancel={() => (rollbackTarget = null)}
/>

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
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .status-cell {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .err {
    margin-top: 0.35rem;
    color: var(--danger);
    font-size: 0.75rem;
    max-width: 22rem;
    max-height: 4.5rem;
    overflow-y: auto;
    overflow-wrap: anywhere;
  }
  .right {
    text-align: right;
  }
</style>
