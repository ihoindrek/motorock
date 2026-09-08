import { describe, expect, it } from "vitest";
import { getTimeLeftFromTarget } from "@/components/giveaway/giveaway-countdown";

describe("getTimeLeftFromTarget", () => {
  it("counts down to the giveaway draw date", () => {
    const now = Date.parse("2026-09-08T12:00:00+03:00");
    const timeLeft = getTimeLeftFromTarget(
      "2026-09-19T23:59:59+03:00",
      now,
    );

    expect(timeLeft.days).toBe(11);
    expect(timeLeft.hours).toBe(11);
  });

  it("returns zeros after the draw", () => {
    const now = Date.parse("2026-09-20T00:00:00+03:00");
    const timeLeft = getTimeLeftFromTarget(
      "2026-09-19T23:59:59+03:00",
      now,
    );

    expect(timeLeft).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("handles invalid target dates safely", () => {
    expect(getTimeLeftFromTarget("not-a-date")).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
