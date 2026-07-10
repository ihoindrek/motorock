"use client";

export async function reportClientError(
  error: Error & { digest?: string },
  meta: Record<string, unknown> = {},
) {
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
