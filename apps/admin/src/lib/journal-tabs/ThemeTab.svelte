<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";

  export let journalId: string;

  interface Theme {
    id: string;
    key: string;
    name: string;
  }
  interface ThemeSetting {
    themeId: string;
    settings: Record<string, string>;
  }

  let themes: Theme[] = [];
  let selectedThemeId = "";
  let primaryColor = "#1d4ed8";
  let secondaryColor = "#0ea5e9";
  let font = "";
  let error = "";
  let saved = false;

  async function load() {
    try {
      themes = await api.get<Theme[]>("/themes");
      const settings = await api.get<ThemeSetting[]>(`/journals/${journalId}/theme-settings`);
      if (settings[0]) {
        selectedThemeId = settings[0].themeId;
        primaryColor = settings[0].settings.primaryColor ?? primaryColor;
        secondaryColor = settings[0].settings.secondaryColor ?? secondaryColor;
        font = settings[0].settings.font ?? "";
      } else if (themes[0]) {
        selectedThemeId = themes[0].id;
      }
    } catch (err) {
      error = (err as Error).message;
    }
  }

  async function save() {
    saved = false;
    try {
      await api.put(`/journals/${journalId}/theme-settings`, {
        themeId: selectedThemeId,
        settings: { primaryColor, secondaryColor, font },
      });
      saved = true;
    } catch (err) {
      error = (err as Error).message;
    }
  }

  onMount(load);
</script>

<h2>Theme</h2>
{#if error}<p class="error">{error}</p>{/if}

<form class="theme-form" on:submit|preventDefault={save}>
  <label>
    Theme
    <select bind:value={selectedThemeId}>
      {#each themes as theme (theme.id)}
        <option value={theme.id}>{theme.name}</option>
      {/each}
    </select>
  </label>
  <label>
    Primary color
    <input type="color" bind:value={primaryColor} />
  </label>
  <label>
    Secondary color
    <input type="color" bind:value={secondaryColor} />
  </label>
  <label>
    Font
    <input placeholder="e.g. Inter, system-ui, sans-serif" bind:value={font} />
  </label>
  <button type="submit">Save</button>
  {#if saved}<span class="saved">Saved</span>{/if}
</form>

<style>
  .theme-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 360px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  input,
  select {
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
    width: fit-content;
  }
  .saved {
    color: #059669;
    font-size: 0.875rem;
  }
  .error {
    color: #dc2626;
  }
</style>
