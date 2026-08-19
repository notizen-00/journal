<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import { api } from "$lib/api";
  import { breadcrumbs } from "$lib/ui";
  import { toastError } from "$lib/toast";
  import { connectJournalEvents, type RealtimeStore } from "$lib/realtime";
  import { readable, type Readable } from "svelte/store";

  import OverviewTab from "$lib/journal-tabs/OverviewTab.svelte";
  import PagesTab from "$lib/journal-tabs/PagesTab.svelte";
  import ArticlesTab from "$lib/journal-tabs/ArticlesTab.svelte";
  import MenusTab from "$lib/journal-tabs/MenusTab.svelte";
  import MediaTab from "$lib/journal-tabs/MediaTab.svelte";
  import ThemeTab from "$lib/journal-tabs/ThemeTab.svelte";
  import SyncTab from "$lib/journal-tabs/SyncTab.svelte";
  import BuildsTab from "$lib/journal-tabs/BuildsTab.svelte";

  interface Journal {
    id: string;
    name: string;
    acronym: string | null;
    domain: string | null;
    status: string;
  }

  $: journalId = $page.params.id ?? "";
  $: tab = $page.url.searchParams.get("tab") ?? "";

  let journal: Journal | null = null;

  // One SSE connection per journal, shared by every tab that needs live state.
  let live: (Readable<RealtimeStore> & { close: () => void }) | null = null;
  let liveStore: Readable<RealtimeStore> = readable({ snapshot: null, connection: "connecting" });
  let connectedId = "";

  $: if (journalId && journalId !== connectedId) {
    live?.close();
    live = connectJournalEvents(journalId);
    liveStore = live;
    connectedId = journalId;
  }

  $: breadcrumbs.set([
    { label: "Journals", href: "/journals" },
    { label: journal?.name ?? "Journal" },
    ...(tab ? [{ label: TAB_LABELS[tab] ?? tab }] : []),
  ]);

  const TAB_LABELS: Record<string, string> = {
    pages: "Pages",
    articles: "Articles",
    menus: "Menus",
    media: "Media",
    theme: "Theme",
    sync: "OAI Sync",
    builds: "Builds",
  };

  async function loadJournal() {
    try {
      journal = await api.get<Journal>(`/journals/${journalId}`);
    } catch (err) {
      toastError(err, "Could not load journal");
    }
  }

  $: if (journalId) void loadJournal();

  onMount(() => () => live?.close());
  onDestroy(() => {
    live?.close();
    breadcrumbs.set([]);
  });

  $: connection = $liveStore.connection;
</script>

<svelte:head><title>{journal?.name ?? "Journal"} · Journal Publisher</title></svelte:head>

<div class="page-head">
  <div class="titles">
    <h1>{journal?.name ?? "…"}</h1>
    <div class="sub">
      {#if journal?.acronym}<span class="muted">{journal.acronym}</span>{/if}
      {#if journal?.domain}<span class="muted">· {journal.domain}</span>{/if}
      <span
        class="conn conn-{connection}"
        title={connection === "live"
          ? "Receiving realtime updates"
          : connection === "connecting"
            ? "Connecting to the realtime feed"
            : "Realtime feed unavailable — retrying"}
      >
        {#if connection === "live"}<span class="live-dot"></span>Live{:else if connection === "connecting"}Connecting…{:else}Offline{/if}
      </span>
    </div>
  </div>
</div>

{#key journalId}
  {#if tab === "pages"}
    <PagesTab {journalId} />
  {:else if tab === "articles"}
    <ArticlesTab {journalId} />
  {:else if tab === "menus"}
    <MenusTab {journalId} />
  {:else if tab === "media"}
    <MediaTab {journalId} />
  {:else if tab === "theme"}
    <ThemeTab {journalId} />
  {:else if tab === "sync"}
    <SyncTab {journalId} live={liveStore} />
  {:else if tab === "builds"}
    <BuildsTab {journalId} live={liveStore} />
  {:else}
    <OverviewTab {journalId} live={liveStore} />
  {/if}
{/key}

<style>
  .page-head {
    margin-bottom: 1.25rem;
  }
  .titles h1 {
    line-height: 1.2;
  }
  .sub {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
    font-size: 0.8125rem;
  }
  .conn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.25rem;
  }
  .conn-live {
    background: var(--success-bg);
    color: var(--success);
  }
  .conn-connecting {
    background: var(--surface-2);
    color: var(--fg-muted);
  }
  .conn-offline {
    background: var(--warning-bg);
    color: var(--warning);
  }
</style>
