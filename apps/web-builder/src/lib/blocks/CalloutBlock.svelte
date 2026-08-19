<script lang="ts">
  export let props: { variant: "info" | "warning" | "success"; text: string };
</script>

<div class="callout {props.variant}">
  {props.text}
</div>

<style>
  .callout {
    margin: 1rem 2rem;
    padding: 1rem 1.25rem;
    border-radius: 0.5rem;
    border-left: 4px solid;
  }
  .callout.info {
    background: #eff6ff;
    border-color: #3b82f6;
  }
  .callout.warning {
    background: #fffbeb;
    border-color: #f59e0b;
  }
  .callout.success {
    background: #ecfdf5;
    border-color: #10b981;
  }
</style>
