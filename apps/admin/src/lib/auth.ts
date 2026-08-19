import { writable } from "svelte/store";
import { browser } from "$app/environment";

const STORAGE_KEY = "journal_admin_token";

function createTokenStore() {
  const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const { subscribe, set } = writable<string | null>(initial);

  return {
    subscribe,
    set(token: string | null) {
      if (browser) {
        if (token) localStorage.setItem(STORAGE_KEY, token);
        else localStorage.removeItem(STORAGE_KEY);
      }
      set(token);
    },
  };
}

export const token = createTokenStore();
