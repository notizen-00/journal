<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface MenuItem {
    id: string;
    label: string;
    url: string;
  }
  interface Menu {
    id: string;
    name: string;
    location: string;
    items: MenuItem[];
  }

  let menus: Menu[] = [];
  let name = "primary";
  let error = "";

  async function load() {
    try {
      menus = await api.get<Menu[]>(`/journals/${journalId}/menus`);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function createMenu() {
    try {
      await api.post(`/journals/${journalId}/menus`, { name, location: "primary", items: [] });
      await load();
    } catch (err) {
      error = (err as Error).message;
    }
  }

  let itemLabel: Record<string, string> = {};
  let itemUrl: Record<string, string> = {};

  async function addItem(menu: Menu) {
    const items = [
      ...menu.items.map((i) => ({ label: i.label, url: i.url })),
      { label: itemLabel[menu.id] ?? "", url: itemUrl[menu.id] ?? "" },
    ];
    await api.put(`/menus/${menu.id}`, { name: menu.name, location: menu.location, items });
    itemLabel[menu.id] = "";
    itemUrl[menu.id] = "";
    await load();
  }

  onMount(load);
</script>

<h2>Menus</h2>
{#if error}<p class="error">{error}</p>{/if}

<form class="inline-form" on:submit|preventDefault={createMenu}>
  <input placeholder="Menu name (e.g. primary)" bind:value={name} required />
  <button type="submit">Add menu</button>
</form>

{#each menus as menu (menu.id)}
  <div class="menu-card">
    <h3>{menu.name} <span class="muted">({menu.location})</span></h3>
    <ul>
      {#each menu.items as item (item.id)}
        <li>{item.label} &rarr; {item.url}</li>
      {/each}
    </ul>
    <div class="inline-form">
      <input placeholder="Label" bind:value={itemLabel[menu.id]} />
      <input placeholder="URL" bind:value={itemUrl[menu.id]} />
      <button on:click={() => addItem(menu)}>Add item</button>
    </div>
  </div>
{/each}

<style>
  .inline-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
  }
  .menu-card {
    padding: 1rem;
    margin-bottom: 1rem;
    background: #fff;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  .muted {
    color: #6b7280;
    font-weight: 400;
  }
  .error {
    color: #dc2626;
  }
</style>
