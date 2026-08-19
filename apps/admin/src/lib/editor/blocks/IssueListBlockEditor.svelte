<script lang="ts">
  import type { IssueListBlock } from "@journal/shared-types";

  export let props: IssueListBlock["props"];
</script>

<div class="grid">
  <div class="field">
    <label for="il-title">Heading</label>
    <input id="il-title" bind:value={props.title} placeholder="Latest Issues" />
  </div>
  <div class="field">
    <label for="il-limit">Max issues</label>
    <input id="il-limit" type="number" min="1" max="50" bind:value={props.limit} />
  </div>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    max-width: 16rem;
  }
</style>
