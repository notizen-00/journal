<script lang="ts">
  import { createEventDispatcher, onMount, tick } from "svelte";
  import { api } from "$lib/api";
  import { toasts } from "$lib/toast";
  import { EMPTY_DOC, docToHtml, docToText, htmlToDoc } from "./serialize";

  /**
   * Hand-rolled rich text editor with a WordPress-style toolbar.
   *
   * Editing runs on `contenteditable` + `document.execCommand`. That API is
   * formally deprecated, but it remains the only built-in browser primitive
   * for rich text editing and is still implemented everywhere; the
   * alternative is reimplementing selection/undo/IME handling from scratch.
   * Everything it produces is normalized back into Tiptap JSON on save, so
   * the deprecated bits never leak into stored content.
   */
  export let content: unknown = EMPTY_DOC;
  /** Enables the media library picker in the image dialog. */
  export let journalId = "";

  const dispatch = createEventDispatcher<{ update: unknown }>();

  let editorEl: HTMLDivElement;
  let ready = false;

  // Toolbar reflects the caret's current formatting.
  let active = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    ul: false,
    ol: false,
    block: "p",
  };

  let showLinkDialog = false;
  let linkUrl = "";
  let savedRange: Range | null = null;

  let showImageDialog = false;
  let imageUrl = "";
  let imageAlt = "";
  let mediaItems: { id: string; fileName: string; url: string; mimeType: string }[] = [];
  let mediaLoading = false;

  let counts = { words: 0, chars: 0 };

  const BLOCK_OPTIONS = [
    { value: "p", label: "Paragraph" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "blockquote", label: "Quote" },
    { value: "pre", label: "Code block" },
  ];

  onMount(() => {
    // Without this, Chrome/Edge insert bare <div> elements for lines
    // created by Enter instead of <p>. Our serializer always writes <p>,
    // so every keystroke's round-tripped HTML would differ from the live
    // DOM by tag name alone — which used to trip the (now-removed)
    // string-comparison guard below and reset the caret on every line.
    document.execCommand("defaultParagraphSeparator", false, "p");
    editorEl.innerHTML = docToHtml(content) || "<p><br></p>";
    ready = true;
    recount();
  });

  // Whether the *next* reactive run of the sync block below is our own
  // emission coming back down as the `content` prop. Set right before
  // dispatching, consumed on the very next Svelte tick.
  //
  // The previous approach compared the round-tripped HTML string against
  // `editorEl.innerHTML` and skipped the rewrite when they matched — but
  // contenteditable's live DOM is never guaranteed to byte-match a decode
  // then re-encode of our own doc model (whitespace, attribute order,
  // browser-specific normalization all differ), so that comparison failed
  // constantly and `innerHTML` got overwritten mid-keystroke, throwing the
  // caret to the start of the document. This flag sidesteps the whole
  // problem: it doesn't care whether the content matches, only whether the
  // change was ours.
  let suppressNextSync = false;

  $: if (ready && editorEl && content) {
    if (suppressNextSync) {
      suppressNextSync = false;
    } else {
      const incoming = docToHtml(content) || "<p><br></p>";
      if (incoming !== editorEl.innerHTML) {
        editorEl.innerHTML = incoming;
        recount();
      }
    }
  }

  function emit() {
    suppressNextSync = true;
    const doc = htmlToDoc(editorEl);
    dispatch("update", doc);
    recount();
  }

  function recount() {
    const text = docToText(htmlToDoc(editorEl)).trim();
    counts = {
      words: text ? text.split(/\s+/).length : 0,
      chars: text.length,
    };
  }

  function exec(command: string, value?: string) {
    editorEl.focus();
    document.execCommand(command, false, value);
    syncActive();
    emit();
  }

  function syncActive() {
    if (!ready) return;
    try {
      active = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block: currentBlockTag(),
      };
    } catch {
      // queryCommandState throws when the selection is outside the editor.
    }
  }

  function currentBlockTag(): string {
    const selection = window.getSelection();
    let node = selection?.anchorNode ?? null;
    while (node && node !== editorEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(tag)) return tag;
      }
      node = node.parentNode;
    }
    return "p";
  }

  function setBlock(e: Event) {
    const tag = (e.target as HTMLSelectElement).value;
    // formatBlock is the one execCommand that needs the tag bracketed.
    exec("formatBlock", `<${tag}>`);
  }

  function saveSelection() {
    const selection = window.getSelection();
    savedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
  }

  function restoreSelection() {
    if (!savedRange) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange);
  }

  function openLinkDialog() {
    saveSelection();
    linkUrl = "";
    showLinkDialog = true;
  }

  function applyLink() {
    const url = linkUrl.trim();
    showLinkDialog = false;
    if (!url) return;
    editorEl.focus();
    restoreSelection();
    if (savedRange && savedRange.collapsed) {
      // No selection: insert the URL as its own linked text.
      document.execCommand("insertHTML", false, `<a href="${url}">${url}</a>`);
    } else {
      document.execCommand("createLink", false, url);
    }
    emit();
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
    editorEl.focus();
    restoreSelection();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${url.trim()}" alt="${alt.trim().replace(/"/g, "&quot;")}">`,
    );
    emit();
  }

  function insertTable() {
    editorEl.focus();
    const cells = "<td><br></td>".repeat(3);
    const header = "<th>Header</th>".repeat(3);
    document.execCommand(
      "insertHTML",
      false,
      `<table><tr>${header}</tr><tr>${cells}</tr><tr>${cells}</tr></table><p><br></p>`,
    );
    emit();
  }

  function insertDivider() {
    exec("insertHorizontalRule");
  }

  function clearFormatting() {
    exec("removeFormat");
  }

  /** Strips Word/Docs markup so pasted content survives serialization. */
  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const html = e.clipboardData?.getData("text/html");
    const text = e.clipboardData?.getData("text/plain") ?? "";

    if (html) {
      const sandbox = document.createElement("div");
      sandbox.innerHTML = html;
      sandbox.querySelectorAll("script,style,meta,link").forEach((el) => el.remove());
      sandbox.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const align = el.style.textAlign;
        for (const attr of Array.from(el.attributes)) {
          if (attr.name !== "href" && attr.name !== "src" && attr.name !== "alt") {
            el.removeAttribute(attr.name);
          }
        }
        if (align && align !== "left") el.style.textAlign = align;
      });
      document.execCommand("insertHTML", false, sandbox.innerHTML);
    } else {
      document.execCommand("insertText", false, text);
    }
    emit();
  }

  function onKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      exec("bold");
    } else if (key === "i") {
      e.preventDefault();
      exec("italic");
    } else if (key === "u") {
      e.preventDefault();
      exec("underline");
    } else if (key === "k") {
      e.preventDefault();
      openLinkDialog();
    }
  }

  /** Svelte actions must be synchronous, so defer the focus rather than await. */
  function focusDialogInput(node: HTMLInputElement) {
    void tick().then(() => node.focus());
  }
</script>

<div class="editor-shell">
  <div class="toolbar">
    <select class="block-select" value={active.block} on:change={setBlock} aria-label="Paragraph style">
      {#each BLOCK_OPTIONS as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>

    <span class="divider"></span>

    <button type="button" class:on={active.bold} title="Bold (Ctrl+B)" on:click={() => exec("bold")}>
      <b>B</b>
    </button>
    <button type="button" class:on={active.italic} title="Italic (Ctrl+I)" on:click={() => exec("italic")}>
      <i>I</i>
    </button>
    <button type="button" class:on={active.underline} title="Underline (Ctrl+U)" on:click={() => exec("underline")}>
      <u>U</u>
    </button>
    <button type="button" class:on={active.strike} title="Strikethrough" on:click={() => exec("strikeThrough")}>
      <s>S</s>
    </button>

    <span class="divider"></span>

    <button type="button" class:on={active.ul} title="Bulleted list" on:click={() => exec("insertUnorderedList")}>
      ☰
    </button>
    <button type="button" class:on={active.ol} title="Numbered list" on:click={() => exec("insertOrderedList")}>
      ⒈
    </button>

    <span class="divider"></span>

    <button type="button" title="Align left" on:click={() => exec("justifyLeft")}>⇤</button>
    <button type="button" title="Align center" on:click={() => exec("justifyCenter")}>≡</button>
    <button type="button" title="Align right" on:click={() => exec("justifyRight")}>⇥</button>

    <span class="divider"></span>

    <button type="button" title="Insert link (Ctrl+K)" on:click={openLinkDialog}>🔗</button>
    <button type="button" title="Insert image" on:click={openImageDialog}>🖼</button>
    <button type="button" title="Insert table" on:click={insertTable}>▦</button>
    <button type="button" title="Insert divider" on:click={insertDivider}>―</button>

    <span class="divider"></span>

    <button type="button" title="Clear formatting" on:click={clearFormatting}>✕</button>
    <button type="button" title="Undo (Ctrl+Z)" on:click={() => exec("undo")}>↶</button>
    <button type="button" title="Redo (Ctrl+Shift+Z)" on:click={() => exec("redo")}>↷</button>
  </div>

  <div
    class="surface"
    bind:this={editorEl}
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    aria-label="Page content"
    on:input={emit}
    on:paste={onPaste}
    on:keydown={onKeydown}
    on:keyup={syncActive}
    on:mouseup={syncActive}
    on:focus={syncActive}
  ></div>

  <div class="statusbar">
    <span>{counts.words} words</span>
    <span>·</span>
    <span>{counts.chars} characters</span>
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
    outline: none;
    line-height: 1.7;
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
