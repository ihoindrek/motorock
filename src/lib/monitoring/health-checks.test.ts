import { describe, expect, it } from "vitest";
import {
  includesAnyMarker,
  summarizeHealthReport,
  type StorefrontHealthReport,
} from "@/lib/monitoring/health-checks";

describe("summarizeHealthReport", () => {
  it("marks degraded reports when only GraphQL direct probe fails", () => {
    const report: StorefrontHealthReport = {
      ok: true,
      degraded: true,
      checkedAt: "2026-08-22T19:26:52.671Z",
      checks: [
        {
          id: "graphql-products",
          ok: false,
          message: "fetch failed",
          durationMs: 10489,
        },
        {
          id: "homepage-en",
          ok: true,
          message: "Homepage /en has 22 product links",
          durationMs: 297,
        },
      ],
    };

    expect(summarizeHealthReport(report)).toContain("Kasutajale nähtav storefront OK");
    expect(summarizeHealthReport(report)).toContain("graphql-products: fetch failed");
  });
});

describe("includesAnyMarker", () => {
  it("matches when one homepage marker is present", () => {
    expect(
      includesAnyMarker("<a href='/en/product/bike'>", [
        "Popular Bikes",
        "/en/product/",
      ]),
    ).toBe(true);
  });
});
