<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "$lib/api";
  import { toastError } from "$lib/toast";
  import "../../app.css";

  let email = "";
  let password = "";
  let loading = false;

  async function submit() {
    loading = true;
    try {
      await login(email, password);
      await goto("/journals");
    } catch (err) {
      toastError(err, "Sign in failed");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Sign in · Journal Publisher</title></svelte:head>

<div class="login-page">
  <form class="login-card" on:submit|preventDefault={submit}>
    <div class="brand">
      <span class="brand-mark">JP</span>
      <div>
        <h1>Journal Publisher</h1>
        <p class="muted">Sign in to manage your journals</p>
      </div>
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} required autocomplete="username" />
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
      />
    </div>

    <button type="submit" class="btn btn-primary submit" disabled={loading}>
      {#if loading}<span class="spinner"></span>{/if}
      {loading ? "Signing in…" : "Sign in"}
    </button>
  </form>
</div>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1.5rem;
    background: linear-gradient(140deg, #101828 0%, #1e3a8a 100%);
  }
  .login-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: min(23rem, 100%);
    padding: 1.75rem;
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .brand-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius);
    background: var(--brand-600);
    color: #fff;
    font-weight: 700;
    flex-shrink: 0;
  }
  .brand h1 {
    font-size: 1.1rem;
  }
  .brand p {
    font-size: 0.8125rem;
    margin-top: 0.1rem;
  }
  .submit {
    margin-top: 0.35rem;
    padding: 0.6rem;
  }
</style>
