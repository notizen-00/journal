<script lang="ts">
  import type { EditorialTeamBlock } from "@journal/shared-types";

  export let props: EditorialTeamBlock["props"];

  function addMember() {
    props.members = [...props.members, { name: "", role: "", affiliation: "" }];
  }

  function removeMember(index: number) {
    props.members = props.members.filter((_, i) => i !== index);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= props.members.length) return;
    const next = [...props.members];
    [next[index], next[target]] = [next[target], next[index]];
    props.members = next;
  }
</script>

<div class="grid">
  <div class="field">
    <label for="et-title">Heading</label>
    <input id="et-title" bind:value={props.title} placeholder="Editorial Board" />
  </div>

  <div class="members">
    {#each props.members as member, index (index)}
      <div class="member">
        <div class="member-fields">
          <input bind:value={member.name} placeholder="Name" aria-label="Name" />
          <input bind:value={member.role} placeholder="Role (e.g. Editor-in-Chief)" aria-label="Role" />
          <input bind:value={member.affiliation} placeholder="Affiliation" aria-label="Affiliation" />
        </div>
        <div class="member-actions">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            title="Move up"
            disabled={index === 0}
            on:click={() => move(index, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            title="Move down"
            disabled={index === props.members.length - 1}
            on:click={() => move(index, 1)}
          >
            ↓
          </button>
          <button type="button" class="btn btn-ghost btn-sm danger" on:click={() => removeMember(index)}>
            Remove
          </button>
        </div>
      </div>
    {/each}
  </div>

  <button type="button" class="btn btn-secondary btn-sm add-member" on:click={addMember}>+ Add member</button>
</div>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .members {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .member {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }
  .member-fields {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    flex: 1;
  }
  .member-actions {
    display: flex;
    gap: 0.15rem;
    flex-shrink: 0;
  }
  .member-actions .btn {
    min-width: 1.7rem;
    padding: 0.25rem 0.4rem;
  }
  .danger {
    color: var(--danger);
  }
  .add-member {
    width: fit-content;
  }
  @media (max-width: 640px) {
    .member {
      flex-wrap: wrap;
    }
    .member-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
