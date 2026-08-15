import { sendAlertEmail } from "@/lib/monitoring/send-alert-email";
import { isSlackAlertsConfigured, sendAlertSlack } from "@/lib/monitoring/send-alert-slack";

type DispatchMonitoringAlertInput = {
  kind: "error" | "health";
  subject: string;
  text: string;
};

export function isMonitoringAlertsEnabled() {
  if (process.env.MONITORING_ALERTS_ENABLED === "false") {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return process.env.MONITORING_ALERTS_ENABLED === "true";
  }

  return (
    isSlackAlertsConfigured() ||
    Boolean(process.env.RESEND_API_KEY?.trim())
  );
}

export function shouldSendEmailAlerts() {
  if (process.env.MONITORING_EMAIL_ALERTS === "true") {
    return true;
  }

  if (process.env.MONITORING_EMAIL_ALERTS === "false") {
    return false;
  }

  // Default: email only when Slack is not configured.
  return !isSlackAlertsConfigured();
}

export async function dispatchMonitoringAlert(input: DispatchMonitoringAlertInput) {
  if (!isMonitoringAlertsEnabled()) {
    console.info("[monitoring] alert dry-run", input);
    return { ok: true as const, dryRun: true as const };
  }

  const results: Array<{ channel: "slack" | "email"; ok: boolean; error?: string }> = [];

  if (isSlackAlertsConfigured()) {
    const slack = await sendAlertSlack({
      kind: input.kind,
      title: input.subject.replace(/^\[Motorock\]\s*/, ""),
      text: input.text,
    });
    results.push({
      channel: "slack",
      ok: slack.ok,
      error: slack.ok ? undefined : slack.error,
    });
  }

  if (shouldSendEmailAlerts() && process.env.RESEND_API_KEY?.trim()) {
    const email = await sendAlertEmail({
      subject: input.subject,
      text: input.text,
    });
    results.push({
      channel: "email",
      ok: email.ok,
      error: email.ok ? undefined : "error" in email ? email.error : undefined,
    });
  }

  if (results.length === 0) {
    return {
      ok: false as const,
      error: "No alert channels configured (set SLACK_WEBHOOK_URL or RESEND_API_KEY)",
    };
  }

  const ok = results.some((result) => result.ok);
  if (!ok) {
    return {
      ok: false as const,
      error: results.map((result) => `${result.channel}: ${result.error}`).join("; "),
    };
  }

  return { ok: true as const, dryRun: false as const, channels: results.filter((r) => r.ok).map((r) => r.channel) };
}
