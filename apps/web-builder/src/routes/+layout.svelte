<script lang="ts">
  import Header from "$lib/themes/default/Header.svelte";
  import Footer from "$lib/themes/default/Footer.svelte";
  import { resolveThemeVars } from "$lib/themes";
  import type { LayoutData } from "./$types";

  export let data: LayoutData;

  $: primaryMenu = data.menus.find((m) => m.location === "primary");
  $: themeVars = resolveThemeVars(data.journal);
</script>

<svelte:head>
  <title>{data.journal.name}</title>
  {#if data.journal.description}<meta name="description" content={data.journal.description} />{/if}
</svelte:head>

<div class="site" style={themeVars}>
  <Header journal={data.journal} menu={primaryMenu} pages={data.pages} articles={data.articles} />
  <main>
    <slot />
  </main>
  <Footer journal={data.journal} />
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: var(--theme-font, system-ui, sans-serif);
    color: var(--theme-fg, #111827);
  }
  .site {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  main {
    flex: 1;
  }
</style>
