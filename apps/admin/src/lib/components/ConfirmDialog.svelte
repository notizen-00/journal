<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";

  export let open = false;
  export let title = "Are you sure?";
  export let message = "";
  export let confirmLabel = "Confirm";
  export let cancelLabel = "Cancel";
  export let danger = false;

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") dispatch("cancel");
  }
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

{#if open}
  <div class="scrim" transition:fade={{ duration: 120 }}>
    <button type="button" class="scrim-hit" aria-label={cancelLabel} on:click={() => dispatch("cancel")}></button>
    <div class="dialog" role="dialog" aria-modal="true" aria-label={title} transition:scale={{ duration: 140, start: 0.97 }}>
      <h3>{title}</h3>
      {#if message}<p class="message">{message}</p>{/if}
      <div class="actions">
        <button type="button" class="btn btn-secondary" on:click={() => dispatch("cancel")}>{cancelLabel}</button>
        <button
          type="button"
          class="btn {danger ? 'btn-danger' : 'btn-primary'}"
          on:click={() => dispatch("confirm")}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 150;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .scrim-hit {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    border: none;
    padding: 0;
    cursor: default;
  }
  .dialog {
    position: relative;
    width: min(26rem, 100%);
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.35rem;
  }
  .message {
    margin-top: 0.5rem;
    color: var(--fg-muted);
    font-size: 0.875rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.35rem;
  }
</style>
