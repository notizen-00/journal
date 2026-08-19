<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let page = 1;
  export let pageSize = 20;
  export let total = 0;
  export let pageSizeOptions = [10, 20, 50, 100];

  const dispatch = createEventDispatcher<{ change: { page: number; pageSize: number } }>();

  $: pageCount = Math.max(1, Math.ceil(total / pageSize));
  $: first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  $: last = Math.min(page * pageSize, total);

  function goTo(next: number) {
    const clamped = Math.min(pageCount, Math.max(1, next));
    if (clamped !== page) dispatch("change", { page: clamped, pageSize });
  }

  function changeSize(e: Event) {
    const nextSize = Number((e.target as HTMLSelectElement).value);
    // Keep the first visible row roughly in view rather than snapping to page 1.
    const nextPage = Math.max(1, Math.floor((page - 1) * pageSize / nextSize) + 1);
    dispatch("change", { page: nextPage, pageSize: nextSize });
  }

  /** Compact page list with ellipses: 1 … 4 5 [6] 7 8 … 20 */
  $: pageList = (() => {
    const window = 1;
    const items: (number | "gap")[] = [];
    let previous = 0;
    for (let n = 1; n <= pageCount; n++) {
      const isEdge = n === 1 || n === pageCount;
      const isNear = Math.abs(n - page) <= window;
      if (!isEdge && !isNear) continue;
      if (previous && n - previous > 1) items.push("gap");
      items.push(n);
      previous = n;
    }
    return items;
  })();
</script>

<div class="pagination">
  <span class="summary">
    {#if total === 0}
      No results
    {:else}
      {first}–{last} of {total}
    {/if}
  </span>

  <div class="spacer"></div>

  <label class="size">
    <span>Rows</span>
    <select value={pageSize} on:change={changeSize}>
      {#each pageSizeOptions as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </label>

  <div class="pages">
    <button type="button" class="nav" disabled={page <= 1} on:click={() => goTo(page - 1)} aria-label="Previous page">
      ‹
    </button>
    {#each pageList as item, i (typeof item === "number" ? `p${item}` : `gap${i}`)}
      {#if item === "gap"}
        <span class="gap">…</span>
      {:else}
        <button type="button" class="num" class:active={item === page} on:click={() => goTo(item)}>
          {item}
        </button>
      {/if}
    {/each}
    <button
      type="button"
      class="nav"
      disabled={page >= pageCount}
      on:click={() => goTo(page + 1)}
      aria-label="Next page"
    >
      ›
    </button>
  </div>
</div>

<style>
  .pagination {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border);
    font-size: 0.8125rem;
    color: var(--fg-muted);
  }
  .spacer {
    flex: 1;
  }
  .size {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--fg-muted);
  }
  .size select {
    width: auto;
    padding: 0.25rem 0.4rem;
    font-size: 0.8125rem;
  }
  .pages {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }
  .num,
  .nav {
    min-width: 1.85rem;
    height: 1.85rem;
    padding: 0 0.35rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--fg-muted);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .num:hover:not(.active),
  .nav:not(:disabled):hover {
    background: var(--surface-2);
    color: var(--fg);
  }
  .num.active {
    background: var(--brand-600);
    border-color: var(--brand-600);
    color: #fff;
    font-weight: 600;
  }
  .nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .gap {
    padding: 0 0.15rem;
  }
</style>
