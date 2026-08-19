<script lang="ts">
  import type { HtmlBlock } from "@journal/shared-types";

  export let props: HtmlBlock["props"];
</script>

<div class="field">
  <label for="html-raw">Raw HTML</label>
  <textarea id="html-raw" class="mono" bind:value={props.html} rows="8" placeholder="<div>…</div>" />
  <span class="field-hint">
    Advanced: inserted into the page as-is. Only use trusted markup — this is not sanitized.
  </span>
</div>

<style>
  textarea {
    font: inherit;
    font-size: 0.8125rem;
    resize: vertical;
  }
</style>
