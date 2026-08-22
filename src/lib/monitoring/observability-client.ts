"use client";

import { isBenignClientError } from "@/lib/client/client-error-utils";

async function reportClientErrorToMonitoring(
  error: Error & { digest?: string },
  meta: Record<string, unknown>,
) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    await fetch("/api/monitoring/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        source: typeof meta.source === "string" ? meta.source : "client",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Alert delivery must never break the UI.
  }
}

export async function reportClientError(
  error: Error & { digest?: string },
  meta: Record<string, unknown> = {},
) {
  if (isBenignClientError(error.message)) {
    return;
  }

  console.error(
    JSON.stringify({
      event: "storefront.client_error",
      level: "error",
      timestamp: new Date().toISOString(),
      message: error.message,
      digest: error.digest,
      ...meta,
    }),
  );

  void reportClientErrorToMonitoring(error, meta);

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, { extra: meta });
  } catch {
    // Optional dependency.
  }
}
