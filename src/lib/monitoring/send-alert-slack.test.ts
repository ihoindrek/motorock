import { describe, expect, it } from "vitest";
import { buildSlackPayloadForTest } from "@/lib/monitoring/send-alert-slack";

describe("slack alert payload", () => {
  it("formats monitoring messages for incoming webhook", () => {
    const payload = buildSlackPayloadForTest({
      kind: "health",
      title: "Storefront tervisekontroll ebaõnnestus",
      text: "homepage-en: missing products\nAeg: 2026-08-15T08:00:00.000Z",
    });

    expect(payload.text).toContain("Tervisekontroll");
    expect(payload.blocks?.[1]?.text?.text).toContain("Storefront");
  });
});
