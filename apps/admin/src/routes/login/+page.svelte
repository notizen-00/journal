<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "$lib/api";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function submit() {
    loading = true;
    error = "";
    try {
      await login(email, password);
      await goto("/journals");
    } catch (err) {
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page">
  <form on:submit|preventDefault={submit}>
    <h1>Journal Publisher</h1>
    <label>
      Email
      <input type="email" bind:value={email} required />
    </label>
    <label>
      Password
      <input type="password" bind:value={password} required />
    </label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
  </form>
</div>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f3f4f6;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 320px;
    padding: 2rem;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  button {
    padding: 0.6rem;
    border: none;
    border-radius: 0.375rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
  }
  .error {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>
