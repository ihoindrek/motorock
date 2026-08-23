import { describe, expect, it } from "vitest";
import {
  includesAnyMarker,
  summarizeHealthReport,
  type StorefrontHealthReport,
} from "@/lib/monitoring/health-checks";

describe("summarizeHealthReport", () => {
  it("marks degraded reports when only one GraphQL probe fails", () => {
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
          id: "graphql-categories",
          ok: true,
          message: 'Category "for-men" reachable',
          durationMs: 220,
        },
        {
          id: "storefront-about",
          ok: true,
          message: "Storefront about page reachable",
          durationMs: 120,
        },
      ],
    };

    expect(summarizeHealthReport(report)).toContain("Storefront OK");
    expect(summarizeHealthReport(report)).toContain("graphql-products: fetch failed");
  });
});

describe("includesAnyMarker", () => {
  it("matches when one marker is present", () => {
    expect(includesAnyMarker("<title>Motorock.eu</title>", ["Motorock"])).toBe(true);
  });
});
