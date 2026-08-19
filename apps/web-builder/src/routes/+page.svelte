<script lang="ts">
  import BlockRenderer from "$lib/blocks/BlockRenderer.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<BlockRenderer blocks={data.blocks} articles={data.articles} issues={data.issues} />
