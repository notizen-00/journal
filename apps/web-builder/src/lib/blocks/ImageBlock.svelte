<script lang="ts">
  export let props: { url: string; alt?: string; caption?: string };
</script>

<figure class="image-block">
  <img src={props.url} alt={props.alt ?? ""} loading="lazy" />
  {#if props.caption}<figcaption>{props.caption}</figcaption>{/if}
</figure>

<style>
  .image-block {
    margin: 1.5rem auto;
    max-width: 960px;
    text-align: center;
  }
  .image-block img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }
  figcaption {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--theme-muted, #6b7280);
  }
</style>
