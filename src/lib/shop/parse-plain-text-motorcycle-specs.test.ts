import { describe, expect, it } from "vitest";
import { parsePlainTextMotorcycleSpecs } from "@/lib/shop/parse-plain-text-motorcycle-specs";
import { buildMotorcycleSpecSnapshot } from "@/lib/shop/motorcycle-spec-snapshot";

const malagutiPlain = `Engine
Engine Type
1 cylinder, 4-stroke, water cooled
Maximum power
11 kW @ 10.750 min
Ignition
ECU
Chassis
Brakes front
hydraulic disc brake with ABS, disc Ø 260 mm
DIMENSIONS AND MASSES
seat height
910 mm
top speed
99 km/h`;

describe("parsePlainTextMotorcycleSpecs", () => {
  it("parses manufacturer copy-paste blocks", () => {
    const specs = parsePlainTextMotorcycleSpecs(malagutiPlain);
    expect(specs.some((spec) => spec.label === "Engine Type")).toBe(true);
    expect(specs.some((spec) => /11 kW/.test(spec.value))).toBe(true);
    expect(specs.some((spec) => spec.value === "ECU")).toBe(true);
    expect(specs.some((spec) => /910 mm/.test(spec.value))).toBe(true);
  });

  it("builds snapshot buckets from plain text ACF field", () => {
    const snapshot = buildMotorcycleSpecSnapshot(malagutiPlain, "", "en");
    expect(snapshot).not.toBeNull();
    expect(snapshot!.engineSpecs.length).toBeGreaterThan(0);
    expect(snapshot!.dimensionSpecs.length).toBeGreaterThan(0);
  });
});
