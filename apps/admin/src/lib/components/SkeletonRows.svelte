<script lang="ts">
  export let rows = 5;
  export let columns = 4;
</script>

<div class="skeleton" aria-hidden="true">
  {#each Array(rows) as _, r (r)}
    <div class="row">
      {#each Array(columns) as __, c (c)}
        <div class="cell" style={`width:${[38, 18, 22, 14, 20, 16][c % 6]}%`}></div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .skeleton {
    padding: 0.5rem 0;
  }
  .row {
    display: flex;
    gap: 1.5rem;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .row:last-child {
    border-bottom: none;
  }
  .cell {
    height: 0.7rem;
    border-radius: 999px;
    background: linear-gradient(90deg, #eceef1 25%, #f5f6f8 50%, #eceef1 75%);
    background-size: 200% 100%;
    animation: shimmer 1.3s linear infinite;
  }
  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }
</style>
