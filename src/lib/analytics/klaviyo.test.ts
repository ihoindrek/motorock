import { afterEach, describe, expect, it, vi } from "vitest";
import {
  identifyKlaviyoProfile,
  isKlaviyoIdentifiableEmail,
  normalizeKlaviyoEmail,
} from "@/lib/analytics/klaviyo";

vi.mock("@/lib/consent/config", () => ({
  getGtmId: () => "GTM-TEST",
  isConsentEnabled: () => false,
}));

describe("klaviyo helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes email", () => {
    expect(normalizeKlaviyoEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });

  it("validates identifiable emails", () => {
    expect(isKlaviyoIdentifiableEmail("buyer@example.com")).toBe(true);
    expect(isKlaviyoIdentifiableEmail("not-an-email")).toBe(false);
  });

  it("identifies profile when marketing consent is not required", () => {
    const learnq: unknown[][] = [];
    vi.stubGlobal("window", { _learnq: learnq });

    identifyKlaviyoProfile("Buyer@Example.com");

    expect(learnq).toEqual([
      ["identify", { $email: "buyer@example.com", email: "buyer@example.com" }],
    ]);
  });
});
