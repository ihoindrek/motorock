import { notifyStorefrontAlert } from "@/lib/monitoring/notify-alert";
import { getStorefrontUrl } from "@/lib/storefront/url";

export const dynamic = "force-dynamic";

const ALERTABLE_SOURCES = new Set([
  "global-error",
  "locale-error",
  "checkout",
  "payment-return",
]);

function isAllowedClientReport(request: Request) {
  const storefront = getStorefrontUrl().replace(/\/$/, "");
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  const referer = request.headers.get("referer")?.replace(/\/$/, "");

  return (
    (origin?.startsWith(storefront) ?? false) ||
    (referer?.startsWith(storefront) ?? false)
  );
}

type ReportErrorBody = {
  message?: string;
  source?: string;
  digest?: string;
  path?: string;
};

export async function POST(request: Request) {
  if (!isAllowedClientReport(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: ReportErrorBody;
  try {
    body = (await request.json()) as ReportErrorBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  const source = body.source?.trim() || "client";

  if (!message) {
    return Response.json({ ok: false, error: "Missing message" }, { status: 400 });
  }

  const benign =
    /failed to load chunk/i.test(message) ||
    /the operation is insecure/i.test(message);

  if (benign) {
    return Response.json({ ok: true, ignored: true, benign: true });
  }

  if (!ALERTABLE_SOURCES.has(source)) {
    return Response.json({ ok: true, ignored: true });
  }

  await notifyStorefrontAlert({
    kind: "error",
    title: message,
    fingerprint: `client:${source}:${message}:${body.digest ?? "no-digest"}`.slice(0, 240),
    lines: [
      `Allikas: ${source}`,
      body.path ? `Path: ${body.path}` : "",
      body.digest ? `Digest: ${body.digest}` : "",
    ].filter(Boolean),
  });

  return Response.json({ ok: true });
}
