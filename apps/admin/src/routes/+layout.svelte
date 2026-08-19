<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { token } from "$lib/auth";
  import { createBreadcrumbsContext } from "$lib/ui";
  import Toaster from "$lib/components/Toaster.svelte";
  import "../app.css";

  // Created fresh per component-tree instance (per SSR request) — see the
  // comment in ui.ts for why this can't be a plain module-level store.
  const breadcrumbs = createBreadcrumbsContext();

  $: isLoginPage = $page.url.pathname === "/login";
  $: journalId = $page.params.id ?? "";

  let sidebarOpen = false;

  const sections = [
    { key: "", label: "Overview", icon: "grid" },
    { key: "pages", label: "Pages", icon: "file" },
    { key: "articles", label: "Articles", icon: "book" },
    { key: "menus", label: "Menus", icon: "list" },
    { key: "media", label: "Media", icon: "image" },
    { key: "theme", label: "Theme", icon: "palette" },
    { key: "sync", label: "OAI Sync", icon: "sync" },
    { key: "builds", label: "Builds", icon: "rocket" },
  ];

  // The journal workspace is a query-param tab within /journals/[id].
  $: activeSection = $page.url.searchParams.get("tab") ?? "";

  onMount(() => {
    const unsubscribe = token.subscribe((value) => {
      if (!value && !isLoginPage) goto("/login");
    });
    return unsubscribe;
  });

  function signOut() {
    token.set(null);
    goto("/login");
  }
</script>

{#if isLoginPage}
  <slot />
{:else}
  <div class="shell" class:sidebar-open={sidebarOpen}>
    <aside>
      <a class="brand" href="/journals">
        <span class="brand-mark">JP</span>
        <span class="brand-text">
          <strong>Journal Publisher</strong>
          <span>Admin</span>
        </span>
      </a>

      <nav>
        <a class="nav-item" class:active={!journalId} href="/journals" on:click={() => (sidebarOpen = false)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
          </svg>
          All journals
        </a>

        {#if journalId}
          <div class="nav-group-label">Journal</div>
          {#each sections as section (section.key)}
            <a
              class="nav-item"
              class:active={activeSection === section.key}
              href={section.key ? `/journals/${journalId}?tab=${section.key}` : `/journals/${journalId}`}
              on:click={() => (sidebarOpen = false)}
            >
              <span class="nav-icon" aria-hidden="true">
                {#if section.icon === "grid"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                {:else if section.icon === "file"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/></svg>
                {:else if section.icon === "book"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>
                {:else if section.icon === "list"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>
                {:else if section.icon === "image"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {:else if section.icon === "palette"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="15.5" cy="10" r="1"/><circle cx="12" cy="15.5" r="1"/></svg>
                {:else if section.icon === "sync"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 3 21 9 15 9"/><polyline points="3 21 3 15 9 15"/><path d="M21 9a9 9 0 0 0-15-3.5L3 8"/><path d="M3 15a9 9 0 0 0 15 3.5L21 16"/></svg>
                {:else}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15l-2 5 5-2"/><path d="M14 4c3 0 6 3 6 6 0 4-5 9-9 11-1-3-3-5-6-6 2-4 7-9 11-9z"/></svg>
                {/if}
              </span>
              {section.label}
            </a>
          {/each}
        {/if}
      </nav>

      <button class="signout" on:click={signOut}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>
    </aside>

    <button
      class="sidebar-scrim"
      aria-label="Close menu"
      tabindex={sidebarOpen ? 0 : -1}
      on:click={() => (sidebarOpen = false)}
    ></button>

    <div class="main-col">
      <!--
        Breadcrumb labels (journal name, page title) come from client-only
        fetches — there's no server-side auth token to fetch them with
        during SSR — so the trail is necessarily empty on the very first
        server-rendered paint and fills in right after hydration, once each
        route's own script runs and populates the shared context store.
      -->
      <header class="topbar">
        <button class="menu-toggle" aria-label="Toggle menu" on:click={() => (sidebarOpen = !sidebarOpen)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <nav class="crumbs" aria-label="Breadcrumb">
          {#each $breadcrumbs as crumb, i (`${i}-${crumb.label}`)}
            {#if i > 0}<span class="crumb-sep" aria-hidden="true">/</span>{/if}
            {#if crumb.href && i < $breadcrumbs.length - 1}
              <a href={crumb.href}>{crumb.label}</a>
            {:else}
              <span class="crumb-current">{crumb.label}</span>
            {/if}
          {/each}
        </nav>
      </header>

      <main>
        <slot />
      </main>
    </div>
  </div>
{/if}

<Toaster />

<style>
  .shell {
    display: flex;
    min-height: 100vh;
  }

  aside {
    width: var(--sidebar-w);
    flex-shrink: 0;
    background: #101828;
    color: #cbd5e1;
    display: flex;
    flex-direction: column;
    padding: 1rem 0.75rem;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.5rem 1rem;
    text-decoration: none;
    color: inherit;
  }
  .brand-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    background: var(--brand-600);
    color: #fff;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    min-width: 0;
  }
  .brand-text strong {
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .brand-text span {
    font-size: 0.7rem;
    color: #64748b;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
  }
  .nav-group-label {
    padding: 1rem 0.6rem 0.35rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.6rem;
    border-radius: var(--radius-sm);
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.875rem;
  }
  .nav-item:hover {
    background: #1c2637;
    color: #fff;
  }
  .nav-item.active {
    background: var(--brand-600);
    color: #fff;
    font-weight: 550;
  }
  .nav-icon {
    display: flex;
    flex-shrink: 0;
  }

  .signout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    margin-top: 1rem;
    padding: 0.5rem;
    background: transparent;
    border: 1px solid #26334a;
    border-radius: var(--radius-sm);
    color: #cbd5e1;
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .signout:hover {
    background: #1c2637;
    color: #fff;
  }

  .main-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: var(--topbar-h);
    padding: 0.5rem 1.5rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .crumbs {
    display: flow-root;
    align-items: baseline;
    gap: 0.4rem;
    min-width: 0;
    overflow: hidden;
  }
  .crumbs a {
    font-size: 0.8125rem;
    color: var(--fg-muted);
    text-decoration: none;
    white-space: nowrap;
  }
  .crumbs a:hover {
    color: var(--brand-600);
  }
  .crumb-sep {
    font-size: 0.8125rem;
    color: var(--fg-subtle);
  }
  /* The trail (Journals / Journal Name / ...) stays small; the current
     page's own segment stands in for a separate page-title row, so it
     carries the visual weight a heading normally would — one row instead
     of a breadcrumb strip stacked on top of each page's own title block. */
  .crumb-current {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
  }

  main {
    flex: 1;
    padding: 1.5rem;
    width: 100%;
  }

  .sidebar-scrim {
    display: none;
  }

  @media (max-width: 860px) {
    aside {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 60;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
      box-shadow: var(--shadow-lg);
    }
    .shell.sidebar-open aside {
      transform: translateX(0);
    }
    .shell.sidebar-open .sidebar-scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(17, 24, 39, 0.45);
      border: none;
      padding: 0;
      cursor: default;
    }
    .menu-toggle {
      display: flex;
    }
    main {
      padding: 1rem;
    }
  }
</style>
