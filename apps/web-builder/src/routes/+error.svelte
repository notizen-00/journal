<script lang="ts">
  import { page } from "$app/stores";
</script>

<svelte:head><title>{$page.status === 404 ? "Page not found" : "Something went wrong"}</title></svelte:head>

<section class="error-page">
  <span class="code">{$page.status}</span>
  <h1>{$page.status === 404 ? "Page not found" : "Something went wrong"}</h1>
  <p class="message">
    {$page.status === 404
      ? "The page you're looking for doesn't exist or may have been moved."
      : ($page.error?.message ?? "An unexpected error occurred.")}
  </p>
  <div class="actions">
    <a class="btn-home" href="/">Go to homepage</a>
    <a class="btn-secondary" href="/articles/">Browse articles</a>
  </div>
</section>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 32rem;
    margin: 0 auto;
    padding: 5rem 1.5rem;
  }
  .code {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--theme-primary, #1d4ed8);
  }
  h1 {
    margin: 0.5rem 0 0.75rem;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--theme-fg, #111827);
  }
  .message {
    margin: 0;
    color: var(--theme-muted, #6b7280);
    line-height: 1.6;
  }
  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn-home {
    padding: 0.7rem 1.5rem;
    border-radius: 999px;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }
  .btn-home:hover {
    filter: brightness(1.08);
  }
  .btn-secondary {
    padding: 0.7rem 1.5rem;
    border-radius: 999px;
    border: 1px solid var(--theme-border, #e5e7eb);
    color: var(--theme-fg, #111827);
    font-weight: 600;
    text-decoration: none;
  }
  .btn-secondary:hover {
    background: var(--theme-surface, #f8fafc);
  }
</style>
