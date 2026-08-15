import { markAlertSent, shouldSendAlert } from "@/lib/monitoring/alert-dedupe";
import { dispatchMonitoringAlert } from "@/lib/monitoring/dispatch-alert";

type NotifyStorefrontAlertInput = {
  kind: "error" | "health";
  title: string;
  fingerprint: string;
  lines: string[];
};

function buildAlertSubject(kind: NotifyStorefrontAlertInput["kind"], title: string) {
  const prefix = kind === "health" ? "Tervisekontroll" : "Viga";
  return `[Motorock] ${prefix}: ${title}`;
}

export async function notifyStorefrontAlert(input: NotifyStorefrontAlertInput) {
  if (!shouldSendAlert(input.fingerprint)) {
    return { ok: true as const, skipped: true as const };
  }

  const text = [
    input.title,
    "",
    ...input.lines,
    "",
    `Aeg: ${new Date().toISOString()}`,
    `Keskkond: ${process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"}`,
  ].join("\n");

  const result = await dispatchMonitoringAlert({
    kind: input.kind,
    subject: buildAlertSubject(input.kind, input.title),
    text,
  });

  if (result.ok) {
    markAlertSent(input.fingerprint);
  }

  return result;
}

export async function notifyStorefrontErrorAlert(
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

  const source = String(meta.source ?? "unknown");
  const fingerprint = `error:${source}:${normalized.name}:${normalized.message}`.slice(
    0,
    240,
  );

  const metaLines = Object.entries(meta)
    .filter(([key]) => key !== "error")
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

  return notifyStorefrontAlert({
    kind: "error",
    title: normalized.message || "Tundmatu serveri viga",
    fingerprint,
    lines: [
      `Allikas: ${source}`,
      `Viga: ${normalized.name ?? "Error"}`,
      ...metaLines,
      normalized.stack ? `\nStack:\n${normalized.stack}` : "",
    ].filter(Boolean),
  });
}
