<script lang="ts">
  import type { Block, BlockType } from "@journal/shared-types";
  import { BLOCK_META as META, BLOCK_ORDER } from "./defaults";
  import HeroBlockEditor from "./HeroBlockEditor.svelte";
  import RichTextBlockEditor from "./RichTextBlockEditor.svelte";
  import ImageBlockEditor from "./ImageBlockEditor.svelte";
  import ArticleListBlockEditor from "./ArticleListBlockEditor.svelte";
  import IssueListBlockEditor from "./IssueListBlockEditor.svelte";
  import EditorialTeamBlockEditor from "./EditorialTeamBlockEditor.svelte";
  import CalloutBlockEditor from "./CalloutBlockEditor.svelte";
  import ButtonBlockEditor from "./ButtonBlockEditor.svelte";
  import HtmlBlockEditor from "./HtmlBlockEditor.svelte";

  export let blocks: Block[];
  export let journalId: string;

  let expandedId: string | null = blocks[0]?.id ?? null;
  let showAddMenu = false;

  function newId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function addBlock(type: BlockType) {
    const block = { id: newId(), type, props: META[type].defaultProps() } as Block;
    blocks = [...blocks, block];
    expandedId = block.id;
    showAddMenu = false;
    queueMicrotask(() => {
      document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function removeBlock(id: string) {
    blocks = blocks.filter((b) => b.id !== id);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    blocks = next;
  }

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  // Svelte's #each still needs a stable component reference per block type;
  // this indirection keeps the template a single loop instead of a 9-way
  // {#if} chain repeated for every block.
  const EDITORS: Record<BlockType, unknown> = {
    hero: HeroBlockEditor,
    richText: RichTextBlockEditor,
    image: ImageBlockEditor,
    articleList: ArticleListBlockEditor,
    issueList: IssueListBlockEditor,
    editorialTeam: EditorialTeamBlockEditor,
    callout: CalloutBlockEditor,
    button: ButtonBlockEditor,
    html: HtmlBlockEditor,
  };
</script>

<div class="block-editor">
  {#if blocks.length === 0}
    <div class="empty">
      <p class="muted">This page has no blocks yet.</p>
    </div>
  {/if}

  {#each blocks as block, index (block.id)}
    {@const meta = META[block.type]}
    {@const expanded = expandedId === block.id}
    <div class="block-card" id={`block-${block.id}`} class:expanded>
      <button type="button" class="block-header" on:click={() => toggle(block.id)}>
        <span class="block-icon" aria-hidden="true">{meta.icon}</span>
        <span class="block-title">
          <strong>{meta.label}</strong>
          {#if !expanded}
            <span class="block-summary">{meta.summary(block.props)}</span>
          {/if}
        </span>
        <span class="chevron" class:open={expanded} aria-hidden="true">›</span>
      </button>

      {#if expanded}
        <div class="block-body">
          <svelte:component this={EDITORS[block.type]} bind:props={block.props} {journalId} />
        </div>
      {/if}

      <div class="block-toolbar">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          title="Move up"
          disabled={index === 0}
          on:click|stopPropagation={() => move(index, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          title="Move down"
          disabled={index === blocks.length - 1}
          on:click|stopPropagation={() => move(index, 1)}
        >
          ↓
        </button>
        <div class="spacer"></div>
        <button type="button" class="btn btn-ghost btn-sm danger" on:click|stopPropagation={() => removeBlock(block.id)}>
          Remove block
        </button>
      </div>
    </div>
  {/each}

  <div class="add-block-wrap">
    <button type="button" class="btn btn-secondary add-block-btn" on:click={() => (showAddMenu = !showAddMenu)}>
      + Add block
    </button>
    {#if showAddMenu}
      <div class="add-menu">
        {#each BLOCK_ORDER as type (type)}
          <button type="button" class="add-menu-item" on:click={() => addBlock(type)}>
            <span aria-hidden="true">{META[type].icon}</span>
            {META[type].label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .block-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .empty {
    padding: 2rem;
    text-align: center;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
  }

  .block-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }
  .block-card.expanded {
    border-color: var(--brand-300, var(--brand-200));
    box-shadow: 0 0 0 3px var(--brand-50);
  }

  .block-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font: inherit;
  }
  .block-header:hover {
    background: var(--surface-2);
  }
  .block-icon {
    font-size: 1.05rem;
    flex-shrink: 0;
  }
  .block-title {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    min-width: 0;
  }
  .block-title strong {
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  .block-summary {
    font-size: 0.8125rem;
    color: var(--fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chevron {
    flex-shrink: 0;
    color: var(--fg-subtle);
    transform: rotate(90deg);
    transition: transform 0.15s ease;
    font-size: 1.1rem;
  }
  .chevron.open {
    transform: rotate(-90deg);
  }

  .block-body {
    padding: 0 0.85rem 0.85rem;
    border-top: 1px solid var(--border);
    padding-top: 0.85rem;
  }

  .block-toolbar {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.35rem 0.6rem;
    border-top: 1px solid var(--border);
    background: var(--surface-2);
  }
  .spacer {
    flex: 1;
  }
  .danger {
    color: var(--danger);
  }

  .add-block-wrap {
    position: relative;
    align-self: flex-start;
  }
  .add-block-btn {
    width: fit-content;
  }
  .add-menu {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(2, minmax(9rem, 1fr));
    gap: 0.15rem;
    padding: 0.4rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .add-menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 0.8125rem;
    text-align: left;
    color: var(--fg);
  }
  .add-menu-item:hover {
    background: var(--surface-2);
  }
</style>
