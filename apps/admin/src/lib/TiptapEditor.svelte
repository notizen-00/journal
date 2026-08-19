<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";

  /** Wraps Tiptap (PRD §11 - minimal rich editor feature set). */
  export let content: unknown = { type: "doc", content: [{ type: "paragraph" }] };

  const dispatch = createEventDispatcher<{ update: unknown }>();
  let element: HTMLDivElement;
  let editor: Editor;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [StarterKit],
      content: content as object,
      onUpdate: ({ editor: e }) => dispatch("update", e.getJSON()),
    });
  });

  onDestroy(() => editor?.destroy());

  function run(command: () => void) {
    return () => {
      command();
      editor.chain().focus();
    };
  }
</script>

<div class="toolbar">
  <button on:click={run(() => editor.chain().focus().toggleBold().run())}>Bold</button>
  <button on:click={run(() => editor.chain().focus().toggleItalic().run())}>Italic</button>
  <button on:click={run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>H2</button>
  <button on:click={run(() => editor.chain().focus().toggleBulletList().run())}>List</button>
  <button on:click={run(() => editor.chain().focus().toggleOrderedList().run())}>1. List</button>
  <button on:click={run(() => editor.chain().focus().toggleBlockquote().run())}>Quote</button>
  <button on:click={run(() => editor.chain().focus().toggleCodeBlock().run())}>Code</button>
  <button on:click={run(() => editor.chain().focus().undo().run())}>Undo</button>
  <button on:click={run(() => editor.chain().focus().redo().run())}>Redo</button>
</div>
<div class="editor" bind:this={element}></div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }
  .toolbar button {
    padding: 0.3rem 0.6rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: #fff;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .editor {
    min-height: 300px;
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: #fff;
  }
  .editor :global(.ProseMirror) {
    outline: none;
  }
</style>
