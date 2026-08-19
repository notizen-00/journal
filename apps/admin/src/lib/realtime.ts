import { get, writable } from "svelte/store";
import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";
import { token } from "./auth";

const API_BASE_URL = env.PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export interface JournalSnapshot {
  journalId: string;
  sync: {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
    processed: number;
    failed: number;
  } | null;
  builds: {
    id: string;
    status: string;
    pagesCount: number | null;
    assetsCount: number | null;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    deployed: boolean;
  }[];
  counts: { articles: number; issues: number; pages: number };
}

export type ConnectionState = "connecting" | "live" | "offline";

export interface RealtimeStore {
  snapshot: JournalSnapshot | null;
  connection: ConnectionState;
}

/**
 * Subscribes to the API's SSE feed for one journal.
 *
 * `EventSource` can't attach an Authorization header, and putting a JWT in
 * the query string leaks it into access logs — so the stream is read with
 * `fetch` + a streaming body reader instead, parsing SSE frames by hand.
 * Reconnects with backoff so a worker restart or API redeploy heals itself.
 */
export function connectJournalEvents(journalId: string) {
  const store = writable<RealtimeStore>({ snapshot: null, connection: "connecting" });

  if (!browser) {
    return { subscribe: store.subscribe, close: () => {} };
  }

  const controller = new AbortController();
  let closed = false;
  let retryDelay = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function handleFrame(frame: string) {
    // An SSE frame is a block of `field: value` lines; we only send `data`.
    const data = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data) return;

    try {
      const snapshot = JSON.parse(data) as JournalSnapshot;
      store.set({ snapshot, connection: "live" });
    } catch {
      // A truncated frame is not worth tearing the connection down for.
    }
  }

  async function run() {
    const authToken = get(token);
    if (!authToken) {
      store.update((s) => ({ ...s, connection: "offline" }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/journals/${journalId}/events`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);

      store.update((s) => ({ ...s, connection: "live" }));
      retryDelay = 1000;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Frames are separated by a blank line; keep the trailing partial.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) handleFrame(frame);
      }
      throw new Error("stream ended");
    } catch (err) {
      if (closed || (err instanceof DOMException && err.name === "AbortError")) return;
      store.update((s) => ({ ...s, connection: "offline" }));
      retryTimer = setTimeout(run, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    }
  }

  void run();

  return {
    subscribe: store.subscribe,
    close() {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller.abort();
    },
  };
}
