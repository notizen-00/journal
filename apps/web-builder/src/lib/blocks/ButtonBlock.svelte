<script lang="ts">
  export let props: { label: string; url: string };
</script>

<div class="button-block">
  <a href={props.url}>{props.label}</a>
</div>

<style>
  .button-block {
    padding: 0.5rem 2rem;
    text-align: center;
  }
  .button-block a {
    display: inline-block;
    padding: 0.6rem 1.4rem;
    border-radius: 0.375rem;
    background: var(--theme-primary, #1d4ed8);
    color: #fff;
    text-decoration: none;
  }
</style>
