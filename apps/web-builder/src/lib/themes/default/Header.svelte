<script lang="ts">
  import type { ArticleData, JournalData, MenuData, PageData } from "$lib/api";
  import SearchBox from "./SearchBox.svelte";

  export let journal: JournalData;
  export let menu: MenuData | undefined;
  export let pages: PageData[] = [];
  export let articles: ArticleData[] = [];

  const hasPage = (slug: string) => pages.some((p) => p.slug === slug);

  // "About" and "Submission" are grouped as dropdowns from known CMS page
  // slugs rather than editable menu items: the admin menu editor only
  // supports flat, top-level items today, so a seeded nested item would be
  // silently flattened the first time someone adds a menu item there.
  $: aboutItems = [
    { slug: "about", label: "About the Journal" },
    { slug: "editorial-board", label: "Editorial Board" },
    { slug: "review-process", label: "Review Process" },
  ].filter((item) => hasPage(item.slug));

  $: submissionItems = [
    { slug: "author-guidelines", label: "Author Guidelines" },
    { slug: "reviewer-guidelines", label: "Reviewer Guidelines" },
  ].filter((item) => hasPage(item.slug));

  $: flatItems = (menu?.items ?? []).filter((i) => !i.parentId);

  let openGroup: string | null = null;
</script>

<header class="site-header">
  <div class="bar">
    <a href="/" class="brand">
      {#if journal.logoUrl}
        <img src={journal.logoUrl} alt={journal.name} class="logo" />
      {:else}
        <span class="logo-fallback">{journal.acronym ?? journal.name.slice(0, 2).toUpperCase()}</span>
      {/if}
      <span class="brand-text">
        <span class="name">{journal.name}</span>
        {#if journal.acronym}<span class="acronym">{journal.acronym}</span>{/if}
      </span>
    </a>

    <nav class="primary-nav" aria-label="Primary">
      <a href="/">Home</a>

      {#if aboutItems.length > 0}
        <div
          class="dropdown"
          role="group"
          on:mouseenter={() => (openGroup = "about")}
          on:mouseleave={() => (openGroup = null)}
        >
          <button
            type="button"
            class="dropdown-trigger"
            aria-expanded={openGroup === "about"}
            on:click={() => (openGroup = openGroup === "about" ? null : "about")}
          >
            About
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {#if openGroup === "about"}
            <div class="dropdown-menu">
              {#each aboutItems as item (item.slug)}
                <a href={`/${item.slug}/`}>{item.label}</a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if submissionItems.length > 0}
        <div
          class="dropdown"
          role="group"
          on:mouseenter={() => (openGroup = "submission")}
          on:mouseleave={() => (openGroup = null)}
        >
          <button
            type="button"
            class="dropdown-trigger"
            aria-expanded={openGroup === "submission"}
            on:click={() => (openGroup = openGroup === "submission" ? null : "submission")}
          >
            Submission
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {#if openGroup === "submission"}
            <div class="dropdown-menu">
              {#each submissionItems as item (item.slug)}
                <a href={`/${item.slug}/`}>{item.label}</a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <a href="/issues/">List of Issues</a>

      {#each flatItems as item (item.id)}
        <a href={item.url} class:cta={item.label === "Online Submission"}>{item.label}</a>
      {/each}
    </nav>

    <div class="actions">
      <SearchBox {articles} />
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: #fff;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .bar {
    max-width: 72rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 1.5rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    min-width: 0;
  }
  .logo {
    height: 2.5rem;
    width: 2.5rem;
    object-fit: contain;
    border-radius: 0.375rem;
  }
  .logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    width: 2.5rem;
    border-radius: 0.5rem;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;
  }
  .name {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--theme-fg, #111827);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .acronym {
    font-size: 0.75rem;
    color: var(--theme-muted, #6b7280);
  }

  .primary-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .primary-nav > a {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    color: var(--theme-fg, #111827);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }
  .primary-nav > a:hover {
    background: var(--theme-surface, #f8fafc);
  }
  .primary-nav > a.cta {
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    margin-left: 0.25rem;
  }
  .primary-nav > a.cta:hover {
    filter: brightness(1.08);
  }

  .dropdown {
    position: relative;
  }
  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    border-radius: 0.375rem;
    color: var(--theme-fg, #111827);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }
  .dropdown-trigger:hover,
  .dropdown-trigger[aria-expanded="true"] {
    background: var(--theme-surface, #f8fafc);
  }
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    min-width: 12rem;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
  }
  .dropdown-menu a {
    padding: 0.55rem 0.75rem;
    border-radius: 0.375rem;
    color: var(--theme-fg, #111827);
    text-decoration: none;
    font-size: 0.875rem;
    white-space: nowrap;
  }
  .dropdown-menu a:hover {
    background: var(--theme-surface, #f8fafc);
  }

  .actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  @media (max-width: 900px) {
    .bar {
      flex-wrap: wrap;
    }
    .primary-nav {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      padding-top: 0.5rem;
      border-top: 1px solid var(--theme-border, #e5e7eb);
    }
  }
</style>
