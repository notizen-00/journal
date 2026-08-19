<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { api } from "$lib/api";
  import TiptapEditor from "$lib/TiptapEditor.svelte";

  $: journalId = $page.params.id ?? "";
  $: pageId = $page.params.pageId ?? "";

  interface PageDoc {
    id: string;
    slug: string;
    title: string;
    status: string;
    blocks: { id: string; type: string; props: { contentJson: unknown } }[];
  }

  let doc: PageDoc | null = null;
  let title = "";
  let contentJson: unknown = { type: "doc", content: [{ type: "paragraph" }] };
  let saving = false;
  let message = "";

  async function load() {
    doc = await api.get<PageDoc>(`/pages/${pageId}`);
    title = doc.title;
    const richText = doc.blocks.find((b) => b.type === "richText");
    contentJson = richText?.props.contentJson ?? contentJson;
  }

  function currentBlocks() {
    return [{ id: "content", type: "richText", props: { contentJson } }];
  }

  async function saveDraft() {
    saving = true;
    message = "";
    try {
      await api.put(`/pages/${pageId}`, { title, blocks: currentBlocks() });
      message = "Draft saved";
    } catch (err) {
      message = (err as Error).message;
    } finally {
      saving = false;
    }
  }

  async function publish() {
    saving = true;
    message = "";
    try {
      await api.put(`/pages/${pageId}`, { title, blocks: currentBlocks() });
      await api.post(`/pages/${pageId}/publish`);
      message = "Published";
    } catch (err) {
      message = (err as Error).message;
    } finally {
      saving = false;
    }
  }

  onMount(load);
</script>

<a class="back" href={`/journals/${journalId}`}>&larr; Back</a>

{#if doc}
  <input class="title" bind:value={title} />
  <TiptapEditor content={contentJson} on:update={(e) => (contentJson = e.detail)} />

  <div class="actions">
    <button on:click={saveDraft} disabled={saving}>Save draft</button>
    <button class="publish" on:click={publish} disabled={saving}>Publish</button>
    {#if message}<span class="message">{message}</span>{/if}
  </div>
{:else}
  <p>Loading...</p>
{/if}

<style>
  .back {
    display: inline-block;
    margin-bottom: 1rem;
    color: #1d4ed8;
    text-decoration: none;
  }
  .title {
    display: block;
    width: 100%;
    font-size: 1.5rem;
    font-weight: 700;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  .actions {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #6b7280;
    color: #fff;
    cursor: pointer;
  }
  button.publish {
    background: #1d4ed8;
  }
  .message {
    font-size: 0.875rem;
    color: #059669;
  }
</style>
