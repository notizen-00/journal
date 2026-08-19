<script lang="ts">
  import type { ButtonBlock } from "@journal/shared-types";

  export let props: ButtonBlock["props"];
</script>

<div class="row">
  <div class="field">
    <label for="btn-label">Label *</label>
    <input id="btn-label" bind:value={props.label} placeholder="Submit Your Article" />
  </div>
  <div class="field">
    <label for="btn-url">URL *</label>
    <input id="btn-url" bind:value={props.url} placeholder="/submission/" />
  </div>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }
  @media (max-width: 560px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
