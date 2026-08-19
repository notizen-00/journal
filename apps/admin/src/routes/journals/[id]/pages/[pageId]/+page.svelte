<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import type { Block } from "@journal/shared-types";
  import { api } from "$lib/api";
  import { breadcrumbs } from "$lib/ui";
  import { toasts, toastError } from "$lib/toast";
  import { normalizeBlocks } from "$lib/editor/blocks/defaults";
  import BlockEditor from "$lib/editor/blocks/BlockEditor.svelte";
  import StatusPill from "$lib/components/StatusPill.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  $: journalId = $page.params.id ?? "";
  $: pageId = $page.params.pageId ?? "";

  interface PageDoc {
    id: string;
    slug: string;
    title: string;
    status: string;
    blocks: { id: string; type: string; props: Record<string, unknown> }[] | null;
  }

  let doc: PageDoc | null = null;
  let title = "";
  let blocks: Block[] = [];
  let loading = true;
  let saving = false;
  let publishing = false;
  let lastSavedAt: Date | null = null;
  let showPublishConfirm = false;

  // Compared against the live `title`/`blocks` on every change, rather than
  // an imperative `dirty = true` flag — a block-array mutation doesn't
  // "just happen once", it happens on every keystroke inside BlockEditor,
  // and there's no single event to hook to set a flag from. A snapshot
  // comparison sidesteps that entirely (same approach as ThemeTab's
  // settingsFingerprint).
  let savedSnapshot = "";
  $: dirty = !loading && JSON.stringify({ title, blocks }) !== savedSnapshot;

  async function load() {
    loading = true;
    try {
      doc = await api.get<PageDoc>(`/pages/${pageId}`);
      title = doc.title;
      blocks = normalizeBlocks(doc.blocks ?? []);
      savedSnapshot = JSON.stringify({ title, blocks });
    } catch (err) {
      toastError(err, "Could not load page");
    } finally {
      loading = false;
    }
  }

  async function saveDraft(showToast = true) {
    if (!doc) return;
    saving = true;
    try {
      await api.put(`/pages/${pageId}`, { title, blocks });
      savedSnapshot = JSON.stringify({ title, blocks });
      lastSavedAt = new Date();
      if (showToast) toasts.success("Draft saved");
    } catch (err) {
      toastError(err, "Could not save draft");
    } finally {
      saving = false;
    }
  }

  async function publish() {
    showPublishConfirm = false;
    publishing = true;
    try {
      await api.put(`/pages/${pageId}`, { title, blocks });
      await api.post(`/pages/${pageId}/publish`);
      savedSnapshot = JSON.stringify({ title, blocks });
      lastSavedAt = new Date();
      if (doc) doc.status = "PUBLISHED";
      toasts.success("Page published — run a build to update the live site", {
        label: "Build now",
        run: () => void buildNow(),
      });
    } catch (err) {
      toastError(err, "Could not publish page");
    } finally {
      publishing = false;
    }
  }

  async function buildNow() {
    try {
      await api.post(`/journals/${journalId}/build`);
      toasts.info("Build queued");
    } catch (err) {
      toastError(err, "Could not queue build");
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void saveDraft();
    }
  }

  // Warn before losing edits to a tab close or reload.
  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (dirty) e.preventDefault();
  }

  $: breadcrumbs.set([
    { label: "Journals", href: "/journals" },
    { label: "Pages", href: `/journals/${journalId}?tab=pages` },
    { label: doc?.title ?? "Page" },
  ]);

  onMount(load);
  onDestroy(() => breadcrumbs.set([]));
</script>

<svelte:head><title>{doc?.title ?? "Page"} · Journal Publisher</title></svelte:head>
<svelte:window on:keydown={onKeydown} on:beforeunload={onBeforeUnload} />

{#if loading}
  <div class="card"><div class="card-body"><p class="muted">Loading page…</p></div></div>
{:else if doc}
  <div class="editor-head">
    <a class="back" href={`/journals/${journalId}?tab=pages`}>← Pages</a>
    <div class="head-meta">
      <StatusPill status={doc.status} />
      <span class="muted slug mono">/{doc.slug}</span>
      {#if dirty}
        <span class="pill pill-warning">Unsaved</span>
      {:else if lastSavedAt}
        <span class="muted saved-at">Saved {lastSavedAt.toLocaleTimeString()}</span>
      {/if}
    </div>
  </div>

  <div class="card title-card">
    <div class="card-body">
      <input
        class="title-input"
        bind:value={title}
        placeholder="Page title"
        aria-label="Page title"
      />
    </div>
  </div>

  <BlockEditor bind:blocks {journalId} />

  <div class="actions">
    <span class="muted hint">Ctrl+S to save · publishing needs a build to reach the live site</span>
    <div class="spacer"></div>
    <button class="btn btn-secondary" on:click={() => saveDraft()} disabled={saving || publishing}>
      {#if saving}<span class="spinner"></span>{/if}
      {saving ? "Saving…" : "Save draft"}
    </button>
    <button class="btn btn-primary" on:click={() => (showPublishConfirm = true)} disabled={saving || publishing}>
      {#if publishing}<span class="spinner"></span>{/if}
      {publishing ? "Publishing…" : "Publish"}
    </button>
  </div>
{:else}
  <div class="card"><div class="card-body"><p class="muted">Page not found.</p></div></div>
{/if}

<ConfirmDialog
  open={showPublishConfirm}
  title="Publish this page?"
  message="A version snapshot is saved and the page is marked published. It appears on the live site after the next build."
  confirmLabel="Publish"
  on:confirm={publish}
  on:cancel={() => (showPublishConfirm = false)}
/>

<style>
  .editor-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .back {
    font-size: 0.875rem;
    text-decoration: none;
    color: var(--fg-muted);
  }
  .back:hover {
    color: var(--brand-600);
  }
  .head-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }
  .slug {
    font-size: 0.75rem;
  }
  .saved-at {
    font-size: 0.75rem;
  }
  .title-card {
    margin-bottom: 0.75rem;
  }
  .title-input {
    border: none;
    padding: 0;
    font-size: 1.5rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    border-radius: 0;
  }
  .title-input:focus {
    box-shadow: none;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  .hint {
    font-size: 0.75rem;
  }
</style>
