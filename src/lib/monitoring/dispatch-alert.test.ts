import { describe, expect, it } from "vitest";
import { shouldSendEmailAlerts } from "@/lib/monitoring/dispatch-alert";

describe("dispatch alert channels", () => {
  it("sends email only when MONITORING_EMAIL_ALERTS=true", () => {
    const previousWebhook = process.env.SLACK_WEBHOOK_URL;
    const previousEmailFlag = process.env.MONITORING_EMAIL_ALERTS;

    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
    delete process.env.MONITORING_EMAIL_ALERTS;
    expect(shouldSendEmailAlerts()).toBe(false);

    process.env.MONITORING_EMAIL_ALERTS = "true";
    expect(shouldSendEmailAlerts()).toBe(true);

    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.MONITORING_EMAIL_ALERTS;
    expect(shouldSendEmailAlerts()).toBe(false);

    if (previousWebhook) {
      process.env.SLACK_WEBHOOK_URL = previousWebhook;
    }

    if (previousEmailFlag) {
      process.env.MONITORING_EMAIL_ALERTS = previousEmailFlag;
    }
  });
});
