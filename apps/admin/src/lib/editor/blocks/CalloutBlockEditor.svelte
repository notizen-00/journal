<script lang="ts">
  import type { CalloutBlock } from "@journal/shared-types";

  export let props: CalloutBlock["props"];
</script>

<div class="grid">
  <div class="field">
    <label for="cb-variant">Style</label>
    <select id="cb-variant" bind:value={props.variant}>
      <option value="info">Info</option>
      <option value="warning">Warning</option>
      <option value="success">Success</option>
    </select>
  </div>
  <div class="field">
    <label for="cb-text">Text</label>
    <textarea id="cb-text" bind:value={props.text} rows="3" placeholder="Submissions close March 31." />
  </div>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  textarea {
    font: inherit;
    resize: vertical;
  }
</style>
