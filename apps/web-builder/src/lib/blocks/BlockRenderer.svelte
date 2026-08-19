<script lang="ts">
  import type { ArticleData, IssueData } from "$lib/api";
  import HeroBlock from "./HeroBlock.svelte";
  import RichTextBlock from "./RichTextBlock.svelte";
  import ImageBlock from "./ImageBlock.svelte";
  import ArticleListBlock from "./ArticleListBlock.svelte";
  import IssueListBlock from "./IssueListBlock.svelte";
  import EditorialTeamBlock from "./EditorialTeamBlock.svelte";
  import CalloutBlock from "./CalloutBlock.svelte";
  import ButtonBlock from "./ButtonBlock.svelte";
  import HtmlBlock from "./HtmlBlock.svelte";

  // Keyed by the Block["type"] values from @journal/shared-types (PRD §13).
  const registry: Record<string, unknown> = {
    hero: HeroBlock,
    richText: RichTextBlock,
    image: ImageBlock,
    articleList: ArticleListBlock,
    issueList: IssueListBlock,
    editorialTeam: EditorialTeamBlock,
    callout: CalloutBlock,
    button: ButtonBlock,
    html: HtmlBlock,
  };

  export let blocks: { id: string; type: string; props: Record<string, unknown> }[] = [];
  export let articles: ArticleData[] = [];
  export let issues: IssueData[] = [];
</script>

{#each blocks as block (block.id)}
  {#if registry[block.type]}
    <svelte:component this={registry[block.type]} props={block.props} {articles} {issues} />
  {/if}
{/each}
