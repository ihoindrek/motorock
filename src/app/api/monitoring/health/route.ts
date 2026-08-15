import { timingSafeEqual } from "node:crypto";
import { notifyStorefrontAlert } from "@/lib/monitoring/notify-alert";
import {
  runStorefrontHealthChecks,
  summarizeHealthReport,
} from "@/lib/monitoring/health-checks";

export const dynamic = "force-dynamic";

function verifySecret(provided: string | null, expected: string) {
  if (!provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function resolveMonitoringSecret() {
  return (
    process.env.MONITORING_ALERT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    null
  );
}

function isAuthorized(request: Request) {
  const secret = resolveMonitoringSecret();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const querySecret = new URL(request.url).searchParams.get("secret");

  return verifySecret(bearer, secret) || verifySecret(querySecret, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const report = await runStorefrontHealthChecks();
  const notify = new URL(request.url).searchParams.get("notify") !== "0";

  if (!report.ok && notify) {
    const failedChecks = report.checks.filter((check) => !check.ok);
    await notifyStorefrontAlert({
      kind: "health",
      title: "Storefront tervisekontroll ebaõnnestus",
      fingerprint: `health:${failedChecks.map((check) => check.id).join("|")}`,
      lines: [
        summarizeHealthReport(report),
        "",
        "Kontrollid:",
        ...report.checks.map(
          (check) =>
            `- ${check.id}: ${check.ok ? "OK" : "FAIL"} — ${check.message} (${check.durationMs}ms)`,
        ),
      ],
    });
  }

  return Response.json(report, { status: report.ok ? 200 : 503 });
}
