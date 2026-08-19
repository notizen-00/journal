<script lang="ts">
  import type { JournalData } from "$lib/api";

  export let journal: JournalData;
</script>

<footer class="site-footer">
  <p>&copy; {new Date().getFullYear()} {journal.name}. Powered by Journal Publisher.</p>
</footer>

<style>
  .site-footer {
    padding: 2rem;
    text-align: center;
    color: var(--theme-muted, #6b7280);
    font-size: 0.875rem;
    border-top: 1px solid var(--theme-border, #e5e7eb);
  }
</style>
