<script lang="ts">
  export let props: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
</script>

<section class="hero" style={props.imageUrl ? `background-image:url(${props.imageUrl})` : ""}>
  <h1>{props.title}</h1>
  {#if props.subtitle}<p class="subtitle">{props.subtitle}</p>{/if}
  {#if props.ctaLabel && props.ctaUrl}
    <a class="cta" href={props.ctaUrl}>{props.ctaLabel}</a>
  {/if}
</section>

<style>
  .hero {
    padding: 4rem 2rem;
    text-align: center;
    background-size: cover;
    background-position: center;
  }
  .cta {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.6rem 1.4rem;
    border-radius: 0.375rem;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    text-decoration: none;
  }
</style>
