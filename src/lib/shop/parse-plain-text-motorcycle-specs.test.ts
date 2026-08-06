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

  it("parses all-caps manufacturer label/value blocks", () => {
    const allCaps = `ENGINE TYPE
1 cylinder, 4-stroke, air-cooled
ENGINE DISPLACEMENT
124.8 cc
MAX POWER
7.0 kW @ 8500 min
BRAKES FRONT
Hydraulic disc brake, brake disc: Ø 267 mm
LENGTH x WIDTH x HEIGHT
2061 x 835 x 1105 mm
FUEL TANK CAPACITY
13 L`;

    const html = allCaps
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    const specs = parsePlainTextMotorcycleSpecs(allCaps);
    expect(specs.some((spec) => spec.label === "ENGINE TYPE")).toBe(true);
    expect(specs.some((spec) => spec.value === "124.8 cc")).toBe(true);
    expect(specs.some((spec) => spec.label === "BRAKES FRONT")).toBe(true);

    const snapshot = buildMotorcycleSpecSnapshot(html, "", "en");
    expect(snapshot).not.toBeNull();
    const totalSpecs =
      snapshot!.engineSpecs.length +
      snapshot!.extendedSpecs.length +
      snapshot!.dimensionSpecs.length;
    expect(totalSpecs).toBeGreaterThanOrEqual(6);
  });
});
