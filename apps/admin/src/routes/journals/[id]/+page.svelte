<script lang="ts">
  import { page } from "$app/stores";
  import PagesTab from "$lib/journal-tabs/PagesTab.svelte";
  import MenusTab from "$lib/journal-tabs/MenusTab.svelte";
  import MediaTab from "$lib/journal-tabs/MediaTab.svelte";
  import ThemeTab from "$lib/journal-tabs/ThemeTab.svelte";
  import SyncTab from "$lib/journal-tabs/SyncTab.svelte";
  import BuildsTab from "$lib/journal-tabs/BuildsTab.svelte";

  $: journalId = $page.params.id ?? "";

  const tabs = ["Pages", "Menus", "Media", "Theme", "OAI Sync", "Builds"] as const;
  let activeTab: (typeof tabs)[number] = "Pages";
</script>

<a class="back" href="/journals">&larr; All journals</a>

<div class="tabs">
  {#each tabs as tab (tab)}
    <button class:active={activeTab === tab} on:click={() => (activeTab = tab)}>{tab}</button>
  {/each}
</div>

<div class="tab-content">
  {#if activeTab === "Pages"}
    <PagesTab {journalId} />
  {:else if activeTab === "Menus"}
    <MenusTab {journalId} />
  {:else if activeTab === "Media"}
    <MediaTab {journalId} />
  {:else if activeTab === "Theme"}
    <ThemeTab {journalId} />
  {:else if activeTab === "OAI Sync"}
    <SyncTab {journalId} />
  {:else if activeTab === "Builds"}
    <BuildsTab {journalId} />
  {/if}
</div>

<style>
  .back {
    display: inline-block;
    margin-bottom: 1rem;
    color: #1d4ed8;
    text-decoration: none;
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1.5rem;
  }
  .tabs button {
    padding: 0.6rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .tabs button.active {
    border-bottom-color: #1d4ed8;
    font-weight: 600;
  }
</style>
