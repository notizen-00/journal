<script lang="ts">
  import { renderTiptapDoc } from "$lib/tiptap-render";

  export let props: { contentJson: unknown };
</script>

<div class="rich-text">
  {@html renderTiptapDoc(props.contentJson)}
</div>

<style>
  .rich-text {
    max-width: 72ch;
    margin: 0 auto;
    padding: 1rem 2rem;
    line-height: 1.7;
  }
</style>
