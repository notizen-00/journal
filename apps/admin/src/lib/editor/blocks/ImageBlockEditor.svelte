<script lang="ts">
  import type { ImageBlock } from "@journal/shared-types";
  import ImagePickerField from "./ImagePickerField.svelte";

  export let props: ImageBlock["props"];
  export let journalId: string;
</script>

<div class="grid">
  <ImagePickerField bind:value={props.url} {journalId} label="Image *" />
  <div class="field">
    <label for="img-alt">Alt text</label>
    <input id="img-alt" bind:value={props.alt} placeholder="Describes the image for screen readers" />
  </div>
  <div class="field">
    <label for="img-caption">Caption</label>
    <input id="img-caption" bind:value={props.caption} placeholder="Shown below the image" />
  </div>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
</style>
