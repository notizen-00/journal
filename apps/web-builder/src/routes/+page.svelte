<script lang="ts">
  import BlockRenderer from "$lib/blocks/BlockRenderer.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: primaryMenu = data.menus.find((m) => m.location === "primary");
  $: onlineSubmissionUrl = primaryMenu?.items.find((i) => i.label === "Online Submission")?.url;

  function hasPage(slug: string) {
    return data.pages.some((p) => p.slug === slug);
  }

  $: sidebarLinks = (
    [
      onlineSubmissionUrl ? { label: "Submission", url: onlineSubmissionUrl } : null,
      hasPage("editorial-board") ? { label: "Editorial Board", url: "/editorial-board/" } : null,
      hasPage("reviewer-guidelines") ? { label: "Reviewer Guidelines", url: "/reviewer-guidelines/" } : null,
      hasPage("review-process") ? { label: "Review Process", url: "/review-process/" } : null,
    ] as ({ label: string; url: string } | null)[]
  ).filter((x): x is { label: string; url: string } => x !== null);

  $: recentArticles = [...data.articles]
    .sort((a, b) => new Date(b.publicationDate ?? 0).getTime() - new Date(a.publicationDate ?? 0).getTime())
    .slice(0, 6);
</script>

<section class="hero">
  <div class="hero-inner">
    {#if data.journal.logoUrl}
      <img src={data.journal.logoUrl} alt={data.journal.name} class="hero-logo" />
    {/if}
    <h1>{data.journal.name}</h1>
    {#if data.journal.description}<p class="tagline">{data.journal.description}</p>{/if}
    <div class="meta">
      {#if data.journal.issn}<span>p-ISSN {data.journal.issn}</span>{/if}
      {#if data.journal.eissn}<span>e-ISSN {data.journal.eissn}</span>{/if}
      <span>Open Access</span>
    </div>
    {#if onlineSubmissionUrl}
      <a class="hero-cta" href={onlineSubmissionUrl}>Submit Your Article</a>
    {/if}
  </div>
</section>

<div class="content">
  <div class="main">
    <section class="about">
      <h2>About the Journal</h2>
      <BlockRenderer blocks={data.blocks} />
    </section>

    {#if recentArticles.length > 0}
      <section class="recent">
        <div class="recent-header">
          <h2>Recent Articles</h2>
          <a href="/articles/" class="view-all">View all articles →</a>
        </div>
        <div class="article-grid">
          {#each recentArticles as article (article.id)}
            <a class="article-card" href={`/articles/${article.slug}/`}>
              <h3>{article.title}</h3>
              {#if article.abstract}<p class="excerpt">{article.abstract.slice(0, 140)}…</p>{/if}
              <div class="card-meta">
                {#if article.publicationDate}
                  <span>{new Date(article.publicationDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                {/if}
                {#if article.issue}
                  <span>Vol {article.issue.volume ?? "-"} No {article.issue.number ?? "-"}</span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  </div>

  {#if sidebarLinks.length > 0}
    <aside class="sidebar">
      {#each sidebarLinks as link (link.label)}
        <a class="sidebar-btn" href={link.url}>{link.label}</a>
      {/each}
    </aside>
  {/if}
</div>

<style>
  .hero {
    background: linear-gradient(135deg, var(--theme-primary, #1d4ed8), var(--theme-secondary, #0ea5e9));
    color: #fff;
    padding: 4rem 1.5rem;
  }
  .hero-inner {
    max-width: 48rem;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .hero-logo {
    height: 4.5rem;
    width: 4.5rem;
    object-fit: contain;
    border-radius: 0.75rem;
    background: #fff;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .hero h1 {
    margin: 0;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
  }
  .tagline {
    margin: 0;
    font-size: 1.05rem;
    opacity: 0.92;
    max-width: 40rem;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1rem;
    font-size: 0.85rem;
    opacity: 0.9;
    margin-top: 0.25rem;
  }
  .hero-cta {
    margin-top: 1rem;
    display: inline-block;
    padding: 0.75rem 1.75rem;
    border-radius: 999px;
    background: #fff;
    color: var(--theme-primary, #1d4ed8);
    font-weight: 700;
    text-decoration: none;
  }
  .hero-cta:hover {
    filter: brightness(0.96);
  }

  .content {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
  @media (min-width: 900px) {
    .content {
      grid-template-columns: 2.2fr 1fr;
      align-items: start;
    }
  }

  .about :global(.rich-text) {
    max-width: none;
    padding: 0;
    margin: 0;
  }
  .about h2,
  .recent h2 {
    margin: 0 0 1rem;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--theme-fg, #111827);
  }

  .recent {
    margin-top: 3rem;
  }
  .recent-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .view-all {
    font-size: 0.875rem;
    color: var(--theme-primary, #1d4ed8);
    text-decoration: none;
    white-space: nowrap;
  }
  .article-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .article-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--theme-border, #e5e7eb);
    background: #fff;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .article-card:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }
  .article-card h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 650;
    color: var(--theme-fg, #111827);
    line-height: 1.35;
  }
  .excerpt {
    margin: 0;
    font-size: 0.85rem;
    color: var(--theme-muted, #6b7280);
    line-height: 1.5;
  }
  .card-meta {
    margin-top: auto;
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--theme-muted, #6b7280);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: sticky;
    top: 5.5rem;
  }
  .sidebar-btn {
    display: block;
    padding: 0.85rem 1.25rem;
    border-radius: 0.5rem;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    letter-spacing: 0.01em;
  }
  .sidebar-btn:hover {
    filter: brightness(1.08);
  }
</style>
