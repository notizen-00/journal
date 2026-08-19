<script lang="ts">
  import type { JournalData } from "$lib/api";

  export let journal: JournalData;
</script>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="about">
      <span class="name">{journal.name}</span>
      {#if journal.issn || journal.eissn}
        <span class="issn">
          {#if journal.issn}p-ISSN {journal.issn}{/if}
          {#if journal.issn && journal.eissn}&nbsp;·&nbsp;{/if}
          {#if journal.eissn}e-ISSN {journal.eissn}{/if}
        </span>
      {/if}
    </div>
    <nav class="links">
      <a href="/">Home</a>
      <a href="/issues/">Issues</a>
      <a href="/articles/">Articles</a>
    </nav>
  </div>
  <p class="copyright">&copy; {new Date().getFullYear()} {journal.name}. Powered by Journal Publisher.</p>
</footer>

<style>
  .site-footer {
    padding: 2.5rem 1.5rem 1.5rem;
    color: var(--theme-muted, #6b7280);
    font-size: 0.875rem;
    border-top: 1px solid var(--theme-border, #e5e7eb);
    background: var(--theme-surface, #f8fafc);
  }
  .footer-inner {
    max-width: 72rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 1.5rem;
  }
  .about {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .name {
    font-weight: 600;
    color: var(--theme-fg, #111827);
  }
  .links {
    display: flex;
    gap: 1.25rem;
  }
  .links a {
    color: var(--theme-muted, #6b7280);
    text-decoration: none;
  }
  .links a:hover {
    color: var(--theme-primary, #1d4ed8);
  }
  .copyright {
    max-width: 72rem;
    margin: 0 auto;
    padding-top: 1.25rem;
    border-top: 1px solid var(--theme-border, #e5e7eb);
    text-align: center;
  }
</style>
