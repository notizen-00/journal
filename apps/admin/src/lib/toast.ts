import { writable } from "svelte/store";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Optional single action, e.g. "Undo" / "View build". */
  action?: { label: string; run: () => void };
}

const DURATIONS: Record<ToastKind, number> = {
  success: 3500,
  info: 4000,
  // Errors stay longer — they usually carry something the operator must read.
  error: 7000,
};

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  let nextId = 1;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  function dismiss(id: number) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function push(kind: ToastKind, message: string, action?: Toast["action"]) {
    const id = nextId++;
    update((toasts) => [...toasts, { id, kind, message, action }]);
    timers.set(
      id,
      setTimeout(() => dismiss(id), DURATIONS[kind]),
    );
    return id;
  }

  return {
    subscribe,
    dismiss,
    success: (message: string, action?: Toast["action"]) => push("success", message, action),
    error: (message: string, action?: Toast["action"]) => push("error", message, action),
    info: (message: string, action?: Toast["action"]) => push("info", message, action),
  };
}

export const toasts = createToastStore();

/**
 * Turns the verbose `METHOD /path -> 500: {json}` errors thrown by the API
 * client into something worth showing in a snackbar.
 */
export function toastError(err: unknown, fallback = "Something went wrong") {
  const raw = err instanceof Error ? err.message : String(err);
  const match = raw.match(/->\s*\d+:\s*(.*)$/s);
  let detail = match?.[1]?.trim() ?? raw;

  try {
    const parsed = JSON.parse(detail) as { message?: string | string[] };
    if (parsed.message) {
      detail = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
    }
  } catch {
    // Not JSON — the raw text is the best message we have.
  }

  toasts.error(detail || fallback);
}
