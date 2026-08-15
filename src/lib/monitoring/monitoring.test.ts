import { describe, expect, it } from "vitest";
import {
  markAlertSent,
  resetAlertDedupeForTests,
  shouldSendAlert,
} from "@/lib/monitoring/alert-dedupe";
import { includesAnyMarker } from "@/lib/monitoring/health-checks";

describe("alert dedupe", () => {
  it("suppresses duplicate alerts within cooldown", () => {
    resetAlertDedupeForTests();

    expect(shouldSendAlert("health:homepage-en")).toBe(true);
    markAlertSent("health:homepage-en");
    expect(shouldSendAlert("health:homepage-en")).toBe(false);
    expect(shouldSendAlert("health:homepage-et")).toBe(true);
  });
});

describe("homepage health markers", () => {
  it("detects product markers in rendered HTML", () => {
    const html =
      '<section aria-labelledby="favorites-motorcycles">Popular Bikes</section><a href="/en/product/brixton-rayburn-125">';

    expect(
      includesAnyMarker(html, [
        "Popular Bikes",
        "favorites-motorcycles",
        "/en/product/",
      ]),
    ).toBe(true);
  });
});
