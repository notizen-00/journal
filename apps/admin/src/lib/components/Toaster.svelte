<script lang="ts">
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import { toasts } from "$lib/toast";
</script>

<div class="toaster" role="region" aria-label="Notifications">
  {#each $toasts as toast (toast.id)}
    <div
      class="toast {toast.kind}"
      role={toast.kind === "error" ? "alert" : "status"}
      animate:flip={{ duration: 180 }}
      in:fly={{ y: 12, duration: 180 }}
      out:fly={{ y: 8, duration: 140 }}
    >
      <span class="icon" aria-hidden="true">
        {#if toast.kind === "success"}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        {:else if toast.kind === "error"}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.6" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="7.5" x2="12" y2="7.6" />
          </svg>
        {/if}
      </span>

      <span class="message">{toast.message}</span>

      {#if toast.action}
        <button
          type="button"
          class="action"
          on:click={() => {
            toast.action?.run();
            toasts.dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      {/if}

      <button type="button" class="close" aria-label="Dismiss" on:click={() => toasts.dismiss(toast.id)}>
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: min(28rem, calc(100vw - 2.5rem));
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
    border-radius: var(--radius);
    background: #1f2937;
    color: #f9fafb;
    box-shadow: var(--shadow-lg);
    font-size: 0.875rem;
  }
  .toast.success .icon {
    color: #34d399;
  }
  .toast.error {
    background: #7f1d1d;
  }
  .toast.error .icon {
    color: #fca5a5;
  }
  .toast.info .icon {
    color: #93c5fd;
  }
  .icon {
    display: flex;
    padding-top: 0.1rem;
    flex-shrink: 0;
  }
  .message {
    flex: 1;
    /* API errors can be long; keep them readable but bounded. */
    max-height: 8rem;
    overflow-y: auto;
    overflow-wrap: anywhere;
  }
  .action {
    background: transparent;
    border: none;
    color: #93c5fd;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 0 0.25rem;
    flex-shrink: 0;
  }
  .action:hover {
    text-decoration: underline;
  }
  .close {
    background: transparent;
    border: none;
    color: inherit;
    opacity: 0.55;
    cursor: pointer;
    padding: 0 0.15rem;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
  .close:hover {
    opacity: 1;
  }
</style>
