<script lang="ts">
  import { createEventDispatcher, onMount, tick } from "svelte";
  import type { Readable } from "svelte/store";
  import { createEditor, EditorContent, type Editor } from "svelte-tiptap";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";
  import Link from "@tiptap/extension-link";
  import TiptapImage from "@tiptap/extension-image";
  import TextAlign from "@tiptap/extension-text-align";
  import Table from "@tiptap/extension-table";
  import TableRow from "@tiptap/extension-table-row";
  import TableCell from "@tiptap/extension-table-cell";
  import TableHeader from "@tiptap/extension-table-header";
  import Placeholder from "@tiptap/extension-placeholder";
  import CharacterCount from "@tiptap/extension-character-count";
  import { api } from "$lib/api";
  import { toasts } from "$lib/toast";
  import { EMPTY_DOC } from "./content";

  /**
   * Real Tiptap/ProseMirror editor. The JSON it reads and writes is exactly
   * the `Page.blocks` shape the static site's `renderTiptapDoc` consumes, so
   * there's no conversion layer between the two — `editor.getJSON()` is the
   * stored doc.
   */
  export let content: unknown = EMPTY_DOC;
  /** Enables the media library picker in the image dialog. */
  export let journalId = "";

  const dispatch = createEventDispatcher<{ update: unknown }>();

  let editor: Readable<Editor>;

  const BLOCK_OPTIONS = [
    { value: "p", label: "Paragraph" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "blockquote", label: "Quote" },
    { value: "pre", label: "Code block" },
  ];

  $: currentBlock = !$editor
    ? "p"
    : $editor.isActive("heading", { level: 2 })
      ? "h2"
      : $editor.isActive("heading", { level: 3 })
        ? "h3"
        : $editor.isActive("heading", { level: 4 })
          ? "h4"
          : $editor.isActive("blockquote")
            ? "blockquote"
            : $editor.isActive("codeBlock")
              ? "pre"
              : "p";

  let showLinkDialog = false;
  let linkUrl = "";
  let savedSelection: { from: number; to: number } | null = null;

  let showImageDialog = false;
  let imageUrl = "";
  let imageAlt = "";
  let mediaItems: { id: string; fileName: string; url: string; mimeType: string }[] = [];
  let mediaLoading = false;

  onMount(() => {
    editor = createEditor({
      content: content && typeof content === "object" ? content : EMPTY_DOC,
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true }),
        TiptapImage,
        TextAlign.configure({ types: ["paragraph", "heading"] }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: "Start writing…" }),
        CharacterCount,
      ],
      onUpdate: ({ editor }) => dispatch("update", editor.getJSON()),
    });
  });

  function setBlock(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    const chain = $editor.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else if (value === "blockquote") chain.setBlockquote().run();
    else if (value === "pre") chain.setCodeBlock().run();
    else chain.setHeading({ level: Number(value[1]) as 2 | 3 | 4 }).run();
  }

  function saveSelection() {
    const { from, to } = $editor.state.selection;
    savedSelection = { from, to };
  }

  function openLinkDialog() {
    saveSelection();
    linkUrl = $editor.getAttributes("link").href ?? "";
    showLinkDialog = true;
  }

  function applyLink() {
    const url = linkUrl.trim();
    showLinkDialog = false;
    const chain = $editor.chain().focus();
    if (savedSelection) chain.setTextSelection(savedSelection);
    if (!url) {
      chain.unsetLink().run();
      return;
    }
    if (savedSelection && savedSelection.from === savedSelection.to) {
      chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      chain.extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  async function openImageDialog() {
    saveSelection();
    imageUrl = "";
    imageAlt = "";
    showImageDialog = true;
    if (journalId && mediaItems.length === 0) {
      mediaLoading = true;
      try {
        mediaItems = await api.get(`/journals/${journalId}/media`);
      } catch {
        // The picker is a convenience; the URL field still works without it.
      } finally {
        mediaLoading = false;
      }
    }
  }

  function insertImage(url: string, alt: string) {
    showImageDialog = false;
    if (!url.trim()) return;
    const chain = $editor.chain().focus();
    if (savedSelection) chain.setTextSelection(savedSelection);
    chain.setImage({ src: url.trim(), alt: alt.trim() }).run();
  }

  function insertTable() {
    $editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  /** Svelte actions must be synchronous, so defer the focus rather than await. */
  function focusDialogInput(node: HTMLInputElement) {
    void tick().then(() => node.focus());
  }
</script>

<div class="editor-shell">
  {#if $editor}
    <div class="toolbar">
      <select class="block-select" value={currentBlock} on:change={setBlock} aria-label="Paragraph style">
        {#each BLOCK_OPTIONS as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <span class="divider"></span>

      <button
        type="button"
        class:on={$editor.isActive("bold")}
        title="Bold (Ctrl+B)"
        on:click={() => $editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </button>
      <button
        type="button"
        class:on={$editor.isActive("italic")}
        title="Italic (Ctrl+I)"
        on:click={() => $editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </button>
      <button
        type="button"
        class:on={$editor.isActive("underline")}
        title="Underline (Ctrl+U)"
        on:click={() => $editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        class:on={$editor.isActive("strike")}
        title="Strikethrough"
        on:click={() => $editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>

      <span class="divider"></span>

      <button
        type="button"
        class:on={$editor.isActive("bulletList")}
        title="Bulleted list"
        on:click={() => $editor.chain().focus().toggleBulletList().run()}
      >
        ☰
      </button>
      <button
        type="button"
        class:on={$editor.isActive("orderedList")}
        title="Numbered list"
        on:click={() => $editor.chain().focus().toggleOrderedList().run()}
      >
        ⒈
      </button>

      <span class="divider"></span>

      <button
        type="button"
        class:on={$editor.isActive({ textAlign: "left" })}
        title="Align left"
        on:click={() => $editor.chain().focus().setTextAlign("left").run()}
      >
        ⇤
      </button>
      <button
        type="button"
        class:on={$editor.isActive({ textAlign: "center" })}
        title="Align center"
        on:click={() => $editor.chain().focus().setTextAlign("center").run()}
      >
        ≡
      </button>
      <button
        type="button"
        class:on={$editor.isActive({ textAlign: "right" })}
        title="Align right"
        on:click={() => $editor.chain().focus().setTextAlign("right").run()}
      >
        ⇥
      </button>

      <span class="divider"></span>

      <button type="button" class:on={$editor.isActive("link")} title="Insert link (Ctrl+K)" on:click={openLinkDialog}>
        🔗
      </button>
      <button type="button" title="Insert image" on:click={openImageDialog}>🖼</button>
      <button type="button" title="Insert table" on:click={insertTable}>▦</button>
      <button type="button" title="Insert divider" on:click={() => $editor.chain().focus().setHorizontalRule().run()}>
        ―
      </button>

      <span class="divider"></span>

      <button
        type="button"
        title="Clear formatting"
        on:click={() => $editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        ✕
      </button>
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        disabled={!$editor.can().undo()}
        on:click={() => $editor.chain().focus().undo().run()}
      >
        ↶
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!$editor.can().redo()}
        on:click={() => $editor.chain().focus().redo().run()}
      >
        ↷
      </button>
    </div>
  {/if}

  <div class="surface">
    <EditorContent editor={$editor} />
  </div>

  <div class="statusbar">
    <span>{$editor?.storage.characterCount.words() ?? 0} words</span>
    <span>·</span>
    <span>{$editor?.storage.characterCount.characters() ?? 0} characters</span>
  </div>
</div>

{#if showLinkDialog}
  <div class="dialog-scrim">
    <button type="button" class="dialog-hit" aria-label="Cancel" on:click={() => (showLinkDialog = false)}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Insert link">
      <h3>Insert link</h3>
      <div class="field">
        <label for="link-url">URL</label>
        <input id="link-url" bind:value={linkUrl} use:focusDialogInput placeholder="https://example.com" />
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" on:click={() => (showLinkDialog = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={applyLink}>Insert</button>
      </div>
    </div>
  </div>
{/if}

{#if showImageDialog}
  <div class="dialog-scrim">
    <button type="button" class="dialog-hit" aria-label="Cancel" on:click={() => (showImageDialog = false)}></button>
    <div class="dialog wide" role="dialog" aria-modal="true" aria-label="Insert image">
      <h3>Insert image</h3>

      {#if journalId}
        <p class="dialog-hint">Pick from the media library, or paste a URL below.</p>
        {#if mediaLoading}
          <p class="muted">Loading media…</p>
        {:else if mediaItems.length > 0}
          <div class="media-grid">
            {#each mediaItems.filter((m) => m.mimeType.startsWith("image/")) as item (item.id)}
              <button type="button" class="media-item" on:click={() => insertImage(item.url, item.fileName)}>
                <img src={item.url} alt={item.fileName} />
                <span>{item.fileName}</span>
              </button>
            {/each}
          </div>
        {:else}
          <p class="muted">No images in the media library yet.</p>
        {/if}
      {/if}

      <div class="field">
        <label for="image-url">Image URL</label>
        <input id="image-url" bind:value={imageUrl} placeholder="https://…/image.jpg" />
      </div>
      <div class="field">
        <label for="image-alt">Alt text</label>
        <input id="image-alt" bind:value={imageAlt} placeholder="Describes the image for screen readers" />
      </div>

      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" on:click={() => (showImageDialog = false)}>Cancel</button>
        <button
          type="button"
          class="btn btn-primary"
          on:click={() => {
            if (!imageUrl.trim()) {
              toasts.error("Enter an image URL or pick one from the media library");
              return;
            }
            insertImage(imageUrl, imageAlt);
          }}
        >
          Insert
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .editor-shell {
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    flex-wrap: wrap;
    padding: 0.4rem 0.5rem;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .toolbar button {
    min-width: 1.9rem;
    height: 1.9rem;
    padding: 0 0.4rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
  }
  .toolbar button:hover {
    background: var(--surface);
    border-color: var(--border-strong);
  }
  .toolbar button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .toolbar button:disabled:hover {
    background: transparent;
    border-color: transparent;
  }
  .toolbar button.on {
    background: var(--brand-100);
    border-color: var(--brand-200);
    color: var(--brand-700);
  }
  .block-select {
    width: auto;
    height: 1.9rem;
    padding: 0 1.4rem 0 0.5rem;
    font-size: 0.8125rem;
  }
  .divider {
    width: 1px;
    height: 1.2rem;
    background: var(--border-strong);
    margin: 0 0.3rem;
  }

  .surface {
    min-height: 22rem;
    max-height: 60vh;
    overflow-y: auto;
    padding: 1.5rem 1.75rem;
    line-height: 1.7;
  }
  .surface :global(.tiptap) {
    outline: none;
  }
  .surface :global(.tiptap p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: var(--fg-subtle, var(--fg-muted));
    pointer-events: none;
  }
  .surface :global(h2),
  .surface :global(h3),
  .surface :global(h4) {
    margin: 1.4rem 0 0.6rem;
    line-height: 1.3;
  }
  .surface :global(p) {
    margin: 0 0 0.9rem;
  }
  .surface :global(blockquote) {
    margin: 1rem 0;
    padding: 0.35rem 0 0.35rem 1rem;
    border-left: 3px solid var(--brand-200);
    color: var(--fg-muted);
  }
  .surface :global(pre) {
    margin: 1rem 0;
    padding: 0.85rem 1rem;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.85rem;
  }
  .surface :global(pre code) {
    background: none;
    color: inherit;
    padding: 0;
  }
  .surface :global(code) {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.9em;
  }
  .surface :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-sm);
  }
  .surface :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  .surface :global(th),
  .surface :global(td) {
    border: 1px solid var(--border-strong);
    padding: 0.5rem 0.65rem;
    text-align: left;
  }
  .surface :global(th) {
    background: var(--surface-2);
    font-weight: 600;
  }
  .surface :global(hr) {
    border: none;
    border-top: 2px solid var(--border-strong);
    margin: 1.5rem 0;
  }
  .surface :global(ul),
  .surface :global(ol) {
    padding-left: 1.5rem;
    margin: 0 0 0.9rem;
  }

  .statusbar {
    display: flex;
    gap: 0.4rem;
    padding: 0.45rem 1rem;
    border-top: 1px solid var(--border);
    background: var(--surface-2);
    font-size: 0.75rem;
    color: var(--fg-muted);
  }

  .dialog-scrim {
    position: fixed;
    inset: 0;
    z-index: 160;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .dialog-hit {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    border: none;
    cursor: default;
  }
  .dialog {
    position: relative;
    width: min(24rem, 100%);
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .dialog.wide {
    width: min(34rem, 100%);
  }
  .dialog-hint {
    font-size: 0.8125rem;
    color: var(--fg-muted);
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
    gap: 0.5rem;
    max-height: 14rem;
    overflow-y: auto;
    padding: 0.15rem;
  }
  .media-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.3rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--fg-muted);
    text-align: left;
  }
  .media-item:hover {
    border-color: var(--brand-500);
  }
  .media-item img {
    width: 100%;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.2rem;
  }
  .media-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
