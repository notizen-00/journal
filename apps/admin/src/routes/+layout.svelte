<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { token } from "$lib/auth";

  // Per-journal modules (Pages, Articles, Menus, Theme, OAI Sync, Builds, ...)
  // live as tabs inside /journals/[id] once a journal is selected (PRD §29).
  const navItems = [{ href: "/journals", label: "Journals" }];

  $: isLoginPage = $page.url.pathname === "/login";

  onMount(() => {
    const unsubscribe = token.subscribe((value) => {
      if (!value && !isLoginPage) goto("/login");
    });
    return unsubscribe;
  });
</script>

{#if isLoginPage}
  <slot />
{:else}
  <div class="shell">
    <aside>
      <div class="brand">Journal Publisher</div>
      <nav>
        {#each navItems as item, i (i)}
          <a href={item.href}>{item.label}</a>
        {/each}
      </nav>
      <button class="logout" on:click={() => token.set(null)}>Sign out</button>
    </aside>
    <main>
      <slot />
    </main>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #f9fafb;
    color: #111827;
  }
  .shell {
    display: flex;
    min-height: 100vh;
  }
  aside {
    width: 220px;
    background: #111827;
    color: #e5e7eb;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }
  .brand {
    font-weight: 700;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }
  nav a {
    color: #e5e7eb;
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 0.375rem;
  }
  nav a:hover {
    background: #1f2937;
  }
  .logout {
    background: transparent;
    border: 1px solid #374151;
    color: #e5e7eb;
    padding: 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  main {
    flex: 1;
    padding: 2rem;
  }
</style>
