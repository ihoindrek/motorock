import { describe, expect, it } from "vitest";
import { shouldSendEmailAlerts } from "@/lib/monitoring/dispatch-alert";

describe("dispatch alert channels", () => {
  it("prefers Slack and skips email by default when webhook is configured", () => {
    const previousWebhook = process.env.SLACK_WEBHOOK_URL;
    const previousEmailFlag = process.env.MONITORING_EMAIL_ALERTS;

    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    delete process.env.MONITORING_EMAIL_ALERTS;

    expect(shouldSendEmailAlerts()).toBe(false);

    process.env.MONITORING_EMAIL_ALERTS = "true";
    expect(shouldSendEmailAlerts()).toBe(true);

    if (previousWebhook) {
      process.env.SLACK_WEBHOOK_URL = previousWebhook;
    } else {
      delete process.env.SLACK_WEBHOOK_URL;
    }

    if (previousEmailFlag) {
      process.env.MONITORING_EMAIL_ALERTS = previousEmailFlag;
    } else {
      delete process.env.MONITORING_EMAIL_ALERTS;
    }
  });
});
