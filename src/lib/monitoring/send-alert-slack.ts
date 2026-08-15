type SendAlertSlackInput = {
  title: string;
  text: string;
  kind: "error" | "health";
};

export function getSlackWebhookUrl() {
  return process.env.SLACK_WEBHOOK_URL?.trim() || null;
}

export function isSlackAlertsConfigured() {
  return Boolean(getSlackWebhookUrl());
}

function buildSlackPayload(input: SendAlertSlackInput) {
  const emoji = input.kind === "health" ? ":warning:" : ":rotating_light:";
  const prefix = input.kind === "health" ? "Tervisekontroll" : "Viga";

  return {
    text: `[Motorock] ${prefix}: ${input.title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Motorock ${prefix}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${input.title}*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: input.text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 24)
            .join("\n"),
        },
      },
    ],
  };
}

export async function sendAlertSlack(input: SendAlertSlackInput) {
  const webhookUrl = getSlackWebhookUrl();
  if (!webhookUrl) {
    return { ok: false as const, error: "SLACK_WEBHOOK_URL is not configured" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSlackPayload(input)),
  });

  if (!response.ok) {
    const detail = `Slack HTTP ${response.status}`;
    console.error("[monitoring] slack alert failed:", detail);
    return { ok: false as const, error: detail };
  }

  return { ok: true as const };
}

export const buildSlackPayloadForTest = buildSlackPayload;
