<script lang="ts">
  import type { RichTextBlock } from "@journal/shared-types";
  import type { TiptapDoc } from "../serialize";
  import RichEditor from "../RichEditor.svelte";

  export let props: RichTextBlock["props"];
  export let journalId: string;

  function onUpdate(e: CustomEvent<unknown>) {
    props.contentJson = e.detail as TiptapDoc;
  }
</script>

<RichEditor content={props.contentJson} {journalId} on:update={onUpdate} />
