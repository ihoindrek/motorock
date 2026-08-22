"use client";

import { useEffect } from "react";
import {
  clearChunkReloadMarker,
  isChunkLoadError,
  reloadOnceAfterChunkError,
} from "@/lib/client/client-error-utils";

function messageFromUnknown(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

/** Recover gracefully from stale JS chunks after a production deploy. */
export function DeploymentRecovery() {
  useEffect(() => {
    clearChunkReloadMarker();

    const handleChunkFailure = (message: string) => {
      if (!isChunkLoadError(message)) {
        return;
      }

      reloadOnceAfterChunkError();
    };

    const onError = (event: ErrorEvent) => {
      handleChunkFailure(event.message || messageFromUnknown(event.error));
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleChunkFailure(messageFromUnknown(event.reason));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
