<script lang="ts">
  import { renderTiptapDoc } from "$lib/tiptap-render";

  export let props: { contentJson: unknown };
</script>

<div class="rich-text">
  {@html renderTiptapDoc(props.contentJson)}
</div>

<style>
  /*
   * Everything below `.rich-text` must be `:global()`.
   *
   * The body of this block is injected with `{@html}`, so Svelte never
   * compiles it and never stamps its scoping class onto those elements —
   * a plain `.rich-text h2 {}` rule compiles to `.rich-text h2.svelte-xxxx`
   * and matches nothing. That is why rich text was the one block whose
   * headings, quotes, tables and links ignored the theme entirely and fell
   * back to the browser's defaults.
   *
   * Every colour here reads a `--theme-*` custom property (set on `.site`
   * by `resolveThemeVars`), so whatever an editor picks in the theme
   * builder — preset, primary/secondary colour, font — flows into the
   * content. Fallbacks match the `default` preset so a theme that omits a
   * token still renders sensibly.
   */
  .rich-text {
    max-width: 72ch;
    margin: 0 auto;
    padding: 1rem 2rem;
    line-height: 1.7;
    color: var(--theme-fg, #111827);
    font-family: var(--theme-font, system-ui, sans-serif);
  }

  .rich-text :global(h1),
  .rich-text :global(h2),
  .rich-text :global(h3),
  .rich-text :global(h4),
  .rich-text :global(h5),
  .rich-text :global(h6) {
    margin: 1.4rem 0 0.6rem;
    line-height: 1.3;
    color: var(--theme-fg, #111827);
  }
  .rich-text :global(h1) {
    font-size: 1.9rem;
  }
  .rich-text :global(h2) {
    font-size: 1.5rem;
  }
  .rich-text :global(h3) {
    font-size: 1.25rem;
  }
  .rich-text :global(h4) {
    font-size: 1.05rem;
  }

  .rich-text :global(p) {
    margin: 0 0 0.9rem;
  }

  .rich-text :global(a) {
    color: var(--theme-primary, #1d4ed8);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
  .rich-text :global(a:hover) {
    color: var(--theme-secondary, #0ea5e9);
  }

  .rich-text :global(ul),
  .rich-text :global(ol) {
    padding-left: 1.5rem;
    margin: 0 0 0.9rem;
  }
  .rich-text :global(li) {
    margin: 0.2rem 0;
  }

  .rich-text :global(blockquote) {
    margin: 1rem 0;
    padding: 0.35rem 0 0.35rem 1rem;
    border-left: 3px solid var(--theme-primary, #1d4ed8);
    color: var(--theme-muted, #6b7280);
    font-style: italic;
  }

  /* Code keeps its own dark surface in every theme — a theme-tinted code
     block stops reading as code, and this matches the admin editor. */
  .rich-text :global(pre) {
    margin: 1rem 0;
    padding: 0.85rem 1rem;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 0.4rem;
    overflow-x: auto;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.85rem;
    line-height: 1.55;
  }
  .rich-text :global(pre code) {
    background: none;
    color: inherit;
    padding: 0;
    font-size: inherit;
  }
  .rich-text :global(code) {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.9em;
    background: var(--theme-surface, #f8fafc);
    border: 1px solid var(--theme-border, #e5e7eb);
    border-radius: 0.25rem;
    padding: 0.1em 0.35em;
  }

  .rich-text :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.4rem;
  }

  .rich-text :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.95em;
  }
  .rich-text :global(th),
  .rich-text :global(td) {
    border: 1px solid var(--theme-border, #e5e7eb);
    padding: 0.5rem 0.65rem;
    text-align: left;
    vertical-align: top;
  }
  .rich-text :global(th) {
    background: var(--theme-surface, #f8fafc);
    font-weight: 600;
  }
  /* Tiptap emits an empty <p> inside every cell; collapse its margin so
     rows don't gain phantom height. */
  .rich-text :global(td p:last-child),
  .rich-text :global(th p:last-child) {
    margin-bottom: 0;
  }

  .rich-text :global(hr) {
    border: none;
    border-top: 2px solid var(--theme-border, #e5e7eb);
    margin: 1.5rem 0;
  }

  .rich-text :global(strong) {
    font-weight: 700;
  }
  .rich-text :global(mark) {
    background: var(--theme-secondary, #0ea5e9);
    color: #fff;
    padding: 0 0.15em;
  }
</style>
