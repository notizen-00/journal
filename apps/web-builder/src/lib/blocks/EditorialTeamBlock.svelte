<script lang="ts">
  export let props: {
    title?: string;
    members: { name: string; role: string; affiliation?: string }[];
  };
</script>

<section class="editorial-team">
  {#if props.title}<h2>{props.title}</h2>{/if}
  <ul class="members">
    {#each props.members as member}
      <li>
        <strong>{member.name}</strong>
        <span class="role">{member.role}</span>
        {#if member.affiliation}<span class="affiliation">{member.affiliation}</span>{/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .editorial-team {
    padding: 1rem 2rem;
  }
  .members {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
  .role,
  .affiliation {
    display: block;
    font-size: 0.875rem;
    color: var(--theme-muted, #6b7280);
  }
</style>
