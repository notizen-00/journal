<script lang="ts">
  import BlockRenderer from "$lib/blocks/BlockRenderer.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<article class="cms-page">
  <h1>{data.title}</h1>
  <BlockRenderer blocks={data.blocks} />
</article>

<style>
  .cms-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
