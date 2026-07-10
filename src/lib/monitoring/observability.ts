type LogLevel = "info" | "warn" | "error";

type StorefrontEvent = {
  event: string;
  level?: LogLevel;
  source?: string;
  [key: string]: unknown;
};

function writeEvent(payload: StorefrontEvent) {
  const line = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });

  if (payload.level === "error") {
    console.error(line);
    return;
  }

  if (payload.level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logStorefrontEvent(
  event: string,
  meta: Record<string, unknown> = {},
  level: LogLevel = "info",
) {
  writeEvent({
    event,
    level,
    ...meta,
  });
}

export async function captureStorefrontError(
  error: unknown,
  meta: Record<string, unknown> = {},
) {
  const normalized =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { message: String(error) };

  writeEvent({
    event: "storefront.error",
    level: "error",
    ...meta,
    error: normalized,
  });

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, { extra: meta });
  } catch {
    // Optional dependency — structured logs remain the fallback.
  }
}
