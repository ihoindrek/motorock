import { describe, expect, it } from "vitest";
import {
  buildMotorcycleSpecSnapshot,
  parseMotorcycleSpecSnapshotJson,
  resolveMotorcycleSpecOverrides,
  serializeMotorcycleSpecSnapshot,
} from "@/lib/shop/motorcycle-spec-snapshot";

const supplierHtml = `
<h2>Overview</h2>
<p>Marketing copy.</p>
<table>
  <tr><td>Engine Type</td><td>1 cylinder, 4-stroke, water cooled</td></tr>
  <tr><td>Maximum power</td><td>11 kW @ 10.750 min</td></tr>
  <tr><td>seat height</td><td>910 mm</td></tr>
</table>
`;

describe("motorcycle spec snapshot", () => {
  it("builds snapshot from supplier HTML table", () => {
    const snapshot = buildMotorcycleSpecSnapshot(supplierHtml, "", "en");
    expect(snapshot).not.toBeNull();
    expect(snapshot?.engineSpecs.length).toBeGreaterThan(0);
    expect(snapshot?.dimensionSpecs.some((spec) => /910/.test(spec.value))).toBe(
      true,
    );
  });

  it("round-trips JSON snapshot", () => {
    const snapshot = buildMotorcycleSpecSnapshot(supplierHtml, "", "en");
    expect(snapshot).not.toBeNull();
    const parsed = parseMotorcycleSpecSnapshotJson(
      serializeMotorcycleSpecSnapshot(snapshot!),
    );
    expect(parsed?.engineSpecs).toEqual(snapshot?.engineSpecs);
  });

  it("prefers stored meta snapshot over live description", () => {
    const snapshot = buildMotorcycleSpecSnapshot(supplierHtml, "", "en");
    const overrides = resolveMotorcycleSpecOverrides({
      longHtml: "<p>AI marketing only</p>",
      shortHtml: "",
      locale: "en",
      meta: [
        {
          key: "_motorock_motorcycle_specs",
          value: serializeMotorcycleSpecSnapshot(snapshot!),
        },
      ],
    });

    expect(overrides?.engineSpecs.length).toBeGreaterThan(0);
  });
});
