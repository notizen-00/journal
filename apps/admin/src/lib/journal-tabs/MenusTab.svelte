<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { toasts, toastError } from "$lib/toast";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SkeletonRows from "$lib/components/SkeletonRows.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  export let journalId: string;

  interface MenuItem {
    id?: string;
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
  let loading = true;
  let savingId = "";

  let showForm = false;
  let newMenu = { name: "", location: "primary" };

  let deleteTarget: Menu | null = null;

  async function load() {
    loading = true;
    try {
      menus = await api.get<Menu[]>(`/journals/${journalId}/menus`);
    } catch (err) {
      toastError(err, "Could not load menus");
    } finally {
      loading = false;
    }
  }

  async function createMenu() {
    try {
      await api.post(`/journals/${journalId}/menus`, {
        name: newMenu.name,
        location: newMenu.location,
        items: [],
      });
      toasts.success(`Menu "${newMenu.name}" created`);
      newMenu = { name: "", location: "primary" };
      showForm = false;
      await load();
    } catch (err) {
      toastError(err, "Could not create menu");
    }
  }

  /**
   * The API replaces a menu's item list wholesale, so every edit sends the
   * full array — that also makes reordering and removal a single request.
   */
  async function saveItems(menu: Menu, items: MenuItem[]) {
    savingId = menu.id;
    try {
      await api.put(`/menus/${menu.id}`, {
        name: menu.name,
        location: menu.location,
        items: items.map((item, index) => ({ label: item.label, url: item.url, order: index })),
      });
      await load();
    } catch (err) {
      toastError(err, "Could not save menu");
    } finally {
      savingId = "";
    }
  }

  let draftLabel: Record<string, string> = {};
  let draftUrl: Record<string, string> = {};

  async function addItem(menu: Menu) {
    const label = (draftLabel[menu.id] ?? "").trim();
    const url = (draftUrl[menu.id] ?? "").trim();
    if (!label || !url) {
      toasts.error("Both a label and a URL are required");
      return;
    }
    await saveItems(menu, [...menu.items, { label, url }]);
    draftLabel[menu.id] = "";
    draftUrl[menu.id] = "";
    toasts.success(`Added "${label}"`);
  }

  async function removeItem(menu: Menu, index: number) {
    const removed = menu.items[index];
    const next = menu.items.filter((_, i) => i !== index);
    await saveItems(menu, next);
    toasts.success(`Removed "${removed.label}"`, {
      label: "Undo",
      run: () => void saveItems(menu, menu.items),
    });
  }

  async function move(menu: Menu, index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= menu.items.length) return;
    const next = [...menu.items];
    [next[index], next[target]] = [next[target], next[index]];
    await saveItems(menu, next);
  }

  async function confirmDelete() {
    const target = deleteTarget;
    deleteTarget = null;
    if (!target) return;
    try {
      await api.del(`/menus/${target.id}`);
      toasts.success(`Menu "${target.name}" deleted`);
      await load();
    } catch (err) {
      toastError(err, "Could not delete menu");
    }
  }

  onMount(load);
</script>

<div class="card head-card">
  <div class="card-header">
    <div>
      <h2>Menus</h2>
      <p class="muted sub">Navigation shown in the public site's header.</p>
    </div>
    <button class="btn btn-primary" on:click={() => (showForm = !showForm)}>
      {showForm ? "Cancel" : "+ New menu"}
    </button>
  </div>

  {#if showForm}
    <form class="card-body new-form" on:submit|preventDefault={createMenu}>
      <div class="field">
        <label for="m-name">Name *</label>
        <input id="m-name" bind:value={newMenu.name} required placeholder="Primary" />
      </div>
      <div class="field">
        <label for="m-location">Location</label>
        <select id="m-location" bind:value={newMenu.location}>
          <option value="primary">Primary (header)</option>
          <option value="footer">Footer</option>
        </select>
      </div>
      <div class="new-actions">
        <button type="submit" class="btn btn-primary">Create menu</button>
      </div>
    </form>
  {/if}
</div>

{#if loading}
  <div class="card"><SkeletonRows rows={3} columns={3} /></div>
{:else if menus.length === 0}
  <div class="card">
    <EmptyState title="No menus yet" message="Create a menu to control the site's navigation." />
  </div>
{:else}
  {#each menus as menu (menu.id)}
    <div class="card menu-card">
      <div class="card-header">
        <div class="menu-title">
          <h3>{menu.name}</h3>
          <span class="pill pill-neutral">{menu.location}</span>
          {#if savingId === menu.id}<span class="spinner"></span>{/if}
        </div>
        <button class="btn btn-ghost btn-sm" on:click={() => (deleteTarget = menu)}>Delete menu</button>
      </div>

      <div class="card-body">
        {#if menu.items.length === 0}
          <p class="muted empty-line">No items yet — add the first one below.</p>
        {:else}
          <ul class="items">
            {#each menu.items as item, index (item.id ?? `${item.label}-${index}`)}
              <li>
                <span class="order-btns">
                  <button
                    class="btn btn-ghost btn-sm"
                    title="Move up"
                    disabled={index === 0 || savingId === menu.id}
                    on:click={() => move(menu, index, -1)}>↑</button
                  >
                  <button
                    class="btn btn-ghost btn-sm"
                    title="Move down"
                    disabled={index === menu.items.length - 1 || savingId === menu.id}
                    on:click={() => move(menu, index, 1)}>↓</button
                  >
                </span>
                <span class="item-label">{item.label}</span>
                <span class="item-url mono muted">{item.url}</span>
                <button
                  class="btn btn-ghost btn-sm danger"
                  disabled={savingId === menu.id}
                  on:click={() => removeItem(menu, index)}
                >
                  Remove
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        <form class="add-row" on:submit|preventDefault={() => addItem(menu)}>
          <input placeholder="Label (e.g. Announcements)" bind:value={draftLabel[menu.id]} />
          <input placeholder="URL (e.g. /announcements/)" bind:value={draftUrl[menu.id]} />
          <button type="submit" class="btn btn-secondary" disabled={savingId === menu.id}>Add item</button>
        </form>
      </div>
    </div>
  {/each}
{/if}

<ConfirmDialog
  open={deleteTarget !== null}
  title="Delete this menu?"
  message={`"${deleteTarget?.name ?? ""}" and all of its items will be removed. The next build will drop it from the site.`}
  confirmLabel="Delete"
  danger
  on:confirm={confirmDelete}
  on:cancel={() => (deleteTarget = null)}
/>

<style>
  .head-card {
    margin-bottom: 1rem;
  }
  .sub {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
  }
  .new-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    background: var(--surface-2);
    border-top: 1px solid var(--border);
  }
  .new-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
  .menu-card {
    margin-bottom: 1rem;
  }
  .menu-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .items {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .items li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    font-size: 0.875rem;
  }
  .order-btns {
    display: flex;
    gap: 0.1rem;
  }
  .order-btns .btn {
    min-width: 1.5rem;
    padding: 0.15rem 0.3rem;
  }
  .item-label {
    font-weight: 500;
  }
  .item-url {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
  }
  .danger {
    color: var(--danger);
  }
  .empty-line {
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  .add-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
    gap: 0.5rem;
  }
  @media (max-width: 700px) {
    .new-form,
    .add-row {
      grid-template-columns: 1fr;
    }
    .items li {
      flex-wrap: wrap;
    }
  }
</style>
