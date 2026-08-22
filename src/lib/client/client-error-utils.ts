const CHUNK_ERROR_PATTERNS = [
  /failed to load chunk/i,
  /loading chunk/i,
  /chunkloaderror/i,
  /importing a module script failed/i,
  /dynamically imported module/i,
];

const BENIGN_CLIENT_ERROR_PATTERNS = [
  /the operation is insecure/i,
  ...CHUNK_ERROR_PATTERNS,
];

export function isChunkLoadError(message: string) {
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function isBenignClientError(message: string) {
  return BENIGN_CLIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

const CHUNK_RELOAD_KEY = "motorock-chunk-reload";

/** Reload once after a deploy/chunk mismatch so users pick up the new asset manifest. */
export function reloadOnceAfterChunkError() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
      return false;
    }

    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage may be blocked — still attempt one reload.
  }

  window.location.reload();
  return true;
}

export function clearChunkReloadMarker() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // Ignore blocked storage.
  }
}
