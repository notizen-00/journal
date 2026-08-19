<script lang="ts">
  export let title = "Nothing here yet";
  export let message = "";
</script>

<div class="empty-state">
  <h3>{title}</h3>
  {#if message}<p>{message}</p>{/if}
  <slot />
</div>
