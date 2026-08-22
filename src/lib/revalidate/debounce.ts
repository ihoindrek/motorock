const DEFAULT_DEBOUNCE_MS = 60_000;

type RevalidateDebounceState = {
  lastRunAt: Map<string, number>;
};

function getState(): RevalidateDebounceState {
  const global = globalThis as typeof globalThis & {
    __motorockRevalidateDebounce?: RevalidateDebounceState;
  };

  if (!global.__motorockRevalidateDebounce) {
    global.__motorockRevalidateDebounce = { lastRunAt: new Map() };
  }

  return global.__motorockRevalidateDebounce;
}

/** Coalesce bursty webhook/import events within a warm serverless instance. */
export function runDebounced(
  key: string,
  fn: () => void,
  intervalMs = DEFAULT_DEBOUNCE_MS,
) {
  const state = getState();
  const now = Date.now();
  const lastRunAt = state.lastRunAt.get(key) ?? 0;

  if (now - lastRunAt < intervalMs) {
    return false;
  }

  state.lastRunAt.set(key, now);
  fn();
  return true;
}

export function resetDebounced(key: string) {
  getState().lastRunAt.delete(key);
}
