<script lang="ts">
  import type { HeroBlock } from "@journal/shared-types";
  import ImagePickerField from "./ImagePickerField.svelte";

  export let props: HeroBlock["props"];
  export let journalId: string;
</script>

<div class="grid">
  <div class="field">
    <label for="hero-title">Title *</label>
    <input id="hero-title" bind:value={props.title} placeholder="Welcome to the journal" />
  </div>
  <div class="field">
    <label for="hero-subtitle">Subtitle</label>
    <input id="hero-subtitle" bind:value={props.subtitle} placeholder="A peer-reviewed, open-access journal" />
  </div>
  <ImagePickerField bind:value={props.imageUrl} {journalId} label="Background image" />
  <div class="row">
    <div class="field">
      <label for="hero-cta-label">Button label</label>
      <input id="hero-cta-label" bind:value={props.ctaLabel} placeholder="Submit Your Article" />
    </div>
    <div class="field">
      <label for="hero-cta-url">Button URL</label>
      <input id="hero-cta-url" bind:value={props.ctaUrl} placeholder="/submission/" />
    </div>
  </div>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
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
