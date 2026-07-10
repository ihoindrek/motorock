export async function register() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      enabled: process.env.NODE_ENV === "production",
      tracesSampleRate: 0.1,
    });
  }
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string },
) {
  const { captureStorefrontError } = await import("@/lib/monitoring/observability");
  await captureStorefrontError(error, {
    source: "next.request_error",
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
  });
}
