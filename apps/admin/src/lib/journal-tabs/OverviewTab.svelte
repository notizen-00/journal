<script lang="ts">
  import { onMount } from "svelte";
  import type { Readable } from "svelte/store";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import type { RealtimeStore } from "$lib/realtime";
  import StatusPill from "$lib/components/StatusPill.svelte";

  export let journalId: string;
  export let live: Readable<RealtimeStore>;

  let syncing = false;
  let building = false;

  interface JournalSource {
    ojsUrl: string;
    oaiEndpoint: string;
    ojsUrl2: string | null;
    oaiEndpoint2: string | null;
  }

  let source: JournalSource | null = null;
  let sourceLoaded = false;
  let editingSource = false;
  let savingSource = false;
  let sourceForm = { ojsUrl: "", oaiEndpoint: "", ojsUrl2: "", oaiEndpoint2: "" };
  let showSecondSource = false;

  async function loadSource() {
    try {
      const journal = await api.get<{ source: JournalSource | null }>(`/journals/${journalId}`);
      source = journal.source;
      sourceForm = {
        ojsUrl: source?.ojsUrl ?? "",
        oaiEndpoint: source?.oaiEndpoint ?? "",
        ojsUrl2: source?.ojsUrl2 ?? "",
        oaiEndpoint2: source?.oaiEndpoint2 ?? "",
      };
      showSecondSource = !!(source?.ojsUrl2 || source?.oaiEndpoint2);
    } catch (err) {
      toastError(err, "Could not load OAI source");
    } finally {
      sourceLoaded = true;
    }
  }

  function startEditingSource() {
    showSecondSource = !!(source?.ojsUrl2 || source?.oaiEndpoint2);
    editingSource = true;
  }

  async function saveSource() {
    savingSource = true;
    try {
      await api.put(`/journals/${journalId}`, {
        source: {
          ojsUrl: sourceForm.ojsUrl,
          oaiEndpoint: sourceForm.oaiEndpoint,
          ojsUrl2: showSecondSource ? sourceForm.ojsUrl2 || undefined : "",
          oaiEndpoint2: showSecondSource ? sourceForm.oaiEndpoint2 || undefined : "",
        },
      });
      toasts.success("OAI source saved");
      editingSource = false;
      await loadSource();
    } catch (err) {
      toastError(err, "Could not save OAI source");
    } finally {
      savingSource = false;
    }
  }

  onMount(loadSource);

  $: snapshot = $live.snapshot;
  $: counts = snapshot?.counts ?? { articles: 0, issues: 0, pages: 0 };
  $: sync = snapshot?.sync ?? null;
  $: latestBuild = snapshot?.builds[0] ?? null;
  $: activeBuild = snapshot?.builds.find((b) => b.deployed) ?? null;

  $: syncBusy = sync?.status === "RUNNING" || sync?.status === "PENDING";
  // A sync can "succeed" while one of several configured OAI sources
  // failed (e.g. an old/legacy endpoint) — shown as PARTIAL rather than a
  // plain green SUCCESS so that failure isn't missed.
  $: syncDisplayStatus = sync && sync.status === "SUCCESS" && sync.errorMessage ? "PARTIAL" : sync?.status;
  $: buildBusy = latestBuild?.status === "RUNNING" || latestBuild?.status === "PENDING";

  async function syncNow() {
    syncing = true;
    try {
      await api.post(`/journals/${journalId}/sync`);
      toasts.info("Harvest queued — progress updates live below");
    } catch (err) {
      toastError(err, "Could not queue sync");
    } finally {
      syncing = false;
    }
  }

  async function buildNow() {
    building = true;
    try {
      await api.post(`/journals/${journalId}/build`);
      toasts.info("Build queued — progress updates live below");
    } catch (err) {
      toastError(err, "Could not queue build");
    } finally {
      building = false;
    }
  }

  function timeAgo(iso: string | null): string {
    if (!iso) return "never";
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
</script>

<div class="stats">
  <div class="card stat">
    <span class="stat-label">Articles</span>
    <span class="stat-value">{counts.articles}</span>
    <a class="stat-link" href={`/journals/${journalId}?tab=articles`}>View articles →</a>
  </div>
  <div class="card stat">
    <span class="stat-label">Issues</span>
    <span class="stat-value">{counts.issues}</span>
    <span class="stat-link muted">Harvested from OAI</span>
  </div>
  <div class="card stat">
    <span class="stat-label">CMS pages</span>
    <span class="stat-value">{counts.pages}</span>
    <a class="stat-link" href={`/journals/${journalId}?tab=pages`}>Edit pages →</a>
  </div>
</div>

<div class="panels">
  <div class="card">
    <div class="card-header">
      <h2>OAI Sync</h2>
      <button class="btn btn-secondary btn-sm" on:click={syncNow} disabled={syncing || syncBusy}>
        {#if syncing || syncBusy}<span class="spinner"></span>{/if}
        {syncBusy ? "Running…" : syncing ? "Queuing…" : "Sync now"}
      </button>
    </div>
    <div class="card-body">
      {#if sync}
        <div class="row">
          <span class="muted">Status</span>
          <StatusPill status={syncDisplayStatus ?? sync.status} />
        </div>
        <div class="row">
          <span class="muted">Records processed</span>
          <strong>{sync.processed}{#if sync.failed > 0}<span class="fail"> ({sync.failed} failed)</span>{/if}</strong>
        </div>
        <div class="row">
          <span class="muted">Last run</span>
          <span>{timeAgo(sync.finishedAt ?? sync.startedAt)}</span>
        </div>
        {#if sync.errorMessage}
          <p class="error-box">{sync.errorMessage}</p>
        {/if}
      {:else}
        <p class="muted">This journal has never been synced.</p>
      {/if}
      <a class="panel-link" href={`/journals/${journalId}?tab=sync`}>Sync history →</a>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Site build</h2>
      <button class="btn btn-primary btn-sm" on:click={buildNow} disabled={building || buildBusy}>
        {#if building || buildBusy}<span class="spinner"></span>{/if}
        {buildBusy ? "Building…" : building ? "Queuing…" : "Build now"}
      </button>
    </div>
    <div class="card-body">
      {#if latestBuild}
        <div class="row">
          <span class="muted">Latest build</span>
          <StatusPill status={latestBuild.status} />
        </div>
        <div class="row">
          <span class="muted">Pages / assets</span>
          <span>{latestBuild.pagesCount ?? "—"} / {latestBuild.assetsCount ?? "—"}</span>
        </div>
        <div class="row">
          <span class="muted">Finished</span>
          <span>{timeAgo(latestBuild.finishedAt)}</span>
        </div>
        <div class="row">
          <span class="muted">Live release</span>
          <span>{activeBuild ? `${activeBuild.id.slice(0, 8)}…` : "none deployed"}</span>
        </div>
        {#if latestBuild.errorMessage}
          <p class="error-box">{latestBuild.errorMessage}</p>
        {/if}
      {:else}
        <p class="muted">No builds yet — run one to publish the static site.</p>
      {/if}
      <a class="panel-link" href={`/journals/${journalId}?tab=builds`}>Build history →</a>
    </div>
  </div>
</div>

<div class="card source-card">
  <div class="card-header">
    <div>
      <h2>OJS / OAI Source</h2>
      <p class="muted sub">Where this journal's articles are harvested from.</p>
    </div>
    {#if !editingSource && sourceLoaded}
      <button class="btn btn-secondary btn-sm" on:click={startEditingSource}>
        {source ? "Edit" : "Configure"}
      </button>
    {/if}
  </div>

  <div class="card-body">
    {#if !sourceLoaded}
      <p class="muted">Loading…</p>
    {:else if editingSource}
      <form class="source-form" on:submit|preventDefault={saveSource}>
        <div class="field">
          <label for="src-ojs">OJS URL</label>
          <input id="src-ojs" bind:value={sourceForm.ojsUrl} placeholder="https://jurnal.unej.ac.id/index.php" required />
        </div>
        <div class="field">
          <label for="src-oai">OAI endpoint</label>
          <input id="src-oai" bind:value={sourceForm.oaiEndpoint} placeholder="https://…/index.php/XXX/oai" required />
        </div>

        {#if showSecondSource}
          <div class="second-source">
            <div class="second-source-head">
              <span class="field-hint strong">Second source (old site)</span>
              <button type="button" class="btn btn-ghost btn-sm" on:click={() => (showSecondSource = false)}>
                Remove
              </button>
            </div>
            <div class="field">
              <label for="src-ojs2">Old OJS URL</label>
              <input id="src-ojs2" bind:value={sourceForm.ojsUrl2} placeholder="https://old.example.ac.id/index.php" />
            </div>
            <div class="field">
              <label for="src-oai2">Old OAI endpoint</label>
              <input id="src-oai2" bind:value={sourceForm.oaiEndpoint2} placeholder="https://old…/index.php/XXX/oai" />
            </div>
          </div>
        {:else}
          <button type="button" class="btn btn-secondary btn-sm add-second" on:click={() => (showSecondSource = true)}>
            + Add a second OAI source
          </button>
        {/if}

        <div class="source-actions">
          <button type="button" class="btn btn-secondary" on:click={() => (editingSource = false)}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={savingSource}>
            {#if savingSource}<span class="spinner"></span>{/if}
            {savingSource ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    {:else if source}
      <div class="row">
        <span class="muted">Primary OJS</span>
        <span class="src-url mono">{source.ojsUrl}</span>
      </div>
      <div class="row">
        <span class="muted">Primary OAI endpoint</span>
        <span class="src-url mono">{source.oaiEndpoint}</span>
      </div>
      {#if source.oaiEndpoint2}
        <div class="row">
          <span class="muted">Secondary OJS</span>
          <span class="src-url mono">{source.ojsUrl2}</span>
        </div>
        <div class="row">
          <span class="muted">Secondary OAI endpoint</span>
          <span class="src-url mono">{source.oaiEndpoint2}</span>
        </div>
      {/if}
    {:else}
      <p class="muted">No OAI source configured — this journal cannot be synced yet.</p>
    {/if}
  </div>
</div>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .stat {
    padding: 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
  }
  .stat-value {
    font-size: 1.85rem;
    font-weight: 680;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .stat-link {
    font-size: 0.8125rem;
    text-decoration: none;
    margin-top: 0.2rem;
  }

  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1rem;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--border);
  }
  .row:last-of-type {
    border-bottom: none;
  }
  .fail {
    color: var(--danger);
    font-weight: 500;
  }
  .error-box {
    margin-top: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: var(--danger-bg);
    color: var(--danger);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    max-height: 8rem;
    overflow-y: auto;
    overflow-wrap: anywhere;
  }
  .panel-link {
    display: inline-block;
    margin-top: 0.85rem;
    font-size: 0.8125rem;
    text-decoration: none;
  }

  .source-card {
    margin-top: 1rem;
  }
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .src-url {
    max-width: 26rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8125rem;
  }
  .source-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    max-width: 32rem;
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
  .add-second {
    width: fit-content;
  }
  .source-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
</style>
