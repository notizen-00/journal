<script lang="ts">
  import type { JournalData, MenuData } from "$lib/api";

  export let journal: JournalData;
  export let menu: MenuData | undefined;
</script>

<header class="site-header">
  <div class="brand">
    {#if journal.logoUrl}<img src={journal.logoUrl} alt={journal.name} class="logo" />{/if}
    <a href="/" class="name">{journal.name}</a>
  </div>
  {#if menu}
    <nav>
      {#each menu.items.filter((i) => !i.parentId) as item (item.id)}
        <a href={item.url}>{item.label}</a>
      {/each}
    </nav>
  {/if}
</header>

<style>
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--theme-border, #e5e7eb);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .logo {
    height: 2rem;
    width: auto;
  }
  .name {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--theme-fg, #111827);
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 1.25rem;
  }
  nav a {
    color: var(--theme-fg, #111827);
    text-decoration: none;
  }
</style>
