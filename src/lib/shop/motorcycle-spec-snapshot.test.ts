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

  it("prefers ACF specs HTML over meta snapshot", () => {
    const tableHtml = `<table><tr><td>Engine Type</td><td>1 cylinder</td></tr></table>`;
    const snapshot = buildMotorcycleSpecSnapshot(tableHtml, "", "en");

    const overrides = resolveMotorcycleSpecOverrides({
      longHtml: "<p>AI marketing only</p>",
      shortHtml: "",
      locale: "en",
      meta: [
        { key: "motorcycle_specs_html", value: tableHtml },
        {
          key: "_motorock_motorcycle_specs",
          value: serializeMotorcycleSpecSnapshot(snapshot!),
        },
      ],
    });

    expect(overrides?.engineSpecs.some((spec) => /cylinder/i.test(spec.value))).toBe(
      true,
    );
  });

  it("localizes ET labels when resolving EN fallback specs", () => {
    const tableHtml = `Engine Type
1 cylinder, 4-stroke, water cooled
Maximum power
11 kW @ 10.750 min
Maximum torque
11 Nm @ 8.000 min
Transmission
6-speed manual transmission
Fuel Type
Gasoline (95 octane)
seat height
910 mm`;

    const overrides = resolveMotorcycleSpecOverrides({
      longHtml: "<p>AI marketing only</p>",
      shortHtml: "",
      locale: "et",
      meta: [],
      metaSources: [{ meta: [{ key: "motorcycle_specs_html", value: tableHtml }] }],
    });

    expect(overrides?.engineSpecs.some((spec) => spec.label === "Mootori tüüp")).toBe(
      true,
    );
    expect(overrides?.engineSpecs.some((spec) => spec.label === "Max võimsus")).toBe(
      true,
    );
    expect(
      overrides?.engineSpecs.some((spec) =>
        /käiguline manuaal/.test(spec.value),
      ),
    ).toBe(true);
    expect(overrides?.generalSpecs.some((spec) => spec.label === "Istme kõrgus")).toBe(
      true,
    );
  });

  it("falls back to sibling locale meta when current translation has no specs", () => {
    const tableHtml = `<table><tr><td>Engine Type</td><td>1 cylinder</td></tr></table>`;

    const overrides = resolveMotorcycleSpecOverrides({
      longHtml: "<p>AI marketing only</p>",
      shortHtml: "",
      locale: "et",
      meta: [],
      metaSources: [{ meta: [{ key: "motorcycle_specs_html", value: tableHtml }] }],
    });

    expect(overrides?.engineSpecs.length).toBeGreaterThan(0);
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
