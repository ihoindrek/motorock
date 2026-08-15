import { getFormFromAddress } from "@/lib/forms/config";

type SendAlertEmailInput = {
  subject: string;
  text: string;
};

export function getMonitoringAlertRecipients(): string[] {
  const raw =
    process.env.MONITORING_ALERT_EMAIL?.trim() ||
    process.env.FORM_BCC_EMAIL?.trim() ||
    process.env.FORM_DEFAULT_TO?.trim() ||
    "dev@motorock.eu";

  return raw
    .split(/[,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isMonitoringAlertsEnabled() {
  if (process.env.MONITORING_ALERTS_ENABLED === "false") {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return process.env.MONITORING_ALERTS_ENABLED === "true";
  }

  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendAlertEmail(input: SendAlertEmailInput) {
  if (!isMonitoringAlertsEnabled()) {
    console.info("[monitoring] alert dry-run", input);
    return { ok: true as const, dryRun: true as const };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured" };
  }

  const recipients = getMonitoringAlertRecipients();
  if (recipients.length === 0) {
    return { ok: false as const, error: "No monitoring alert recipients configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFormFromAddress(),
      to: recipients,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    let detail = `Resend HTTP ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string; name?: string };
      detail = body.message || body.name || detail;
    } catch {
      // ignore parse errors
    }

    console.error("[monitoring] alert email failed:", detail);
    return { ok: false as const, error: detail };
  }

  return { ok: true as const, dryRun: false as const };
}
