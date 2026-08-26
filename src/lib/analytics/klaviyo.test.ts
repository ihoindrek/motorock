import { afterEach, describe, expect, it, vi } from "vitest";
import {
  identifyKlaviyoProfile,
  isKlaviyoIdentifiableEmail,
  normalizeKlaviyoEmail,
  trackKlaviyoAddedToCart,
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

  it("tracks Added to Cart metric", () => {
    const learnq: unknown[][] = [];
    vi.stubGlobal("window", { _learnq: learnq, location: { href: "https://motorock.eu/et" } });

    trackKlaviyoAddedToCart({
      item_id: "22398",
      item_name: "Test Jacket",
      price: 99,
      quantity: 1,
    });

    expect(learnq[0]?.[0]).toBe("track");
    expect(learnq[0]?.[1]).toBe("Added to Cart");
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
