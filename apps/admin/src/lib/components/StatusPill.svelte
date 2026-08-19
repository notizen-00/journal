<script lang="ts">
  /** Shared status vocabulary for BuildStatus / SyncStatus / PageStatus. */
  export let status: string;

  const TONE: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
    SUCCESS: "success",
    PUBLISHED: "success",
    ACTIVE: "success",
    FAILED: "danger",
    RUNNING: "info",
    PENDING: "warning",
    DRAFT: "neutral",
    ARCHIVED: "neutral",
    ROLLED_BACK: "neutral",
    INACTIVE: "neutral",
    NEVER_RUN: "neutral",
    // Synthetic status (not a DB value): a sync run that succeeded but had
    // one of several OAI sources fail. Shown instead of a plain green
    // SUCCESS so a failed secondary source isn't mistaken for "all good".
    PARTIAL: "warning",
  };

  $: tone = TONE[status] ?? "neutral";
  $: busy = status === "RUNNING" || status === "PENDING";
  $: label = status.replace(/_/g, " ");
</script>

<span class="pill pill-{tone}">
  {#if busy}<span class="live-dot"></span>{/if}
  {label}
</span>
