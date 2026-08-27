import { describe, expect, it } from "vitest";
import type { SizeGuide } from "@/types/size-guide";
import {
  buildSizeGuideRegistry,
  normalizeGuideBrandSlug,
  sizeGuideLookupKey,
} from "@/lib/shop/size-guide-registry";

function guide(
  overrides: Partial<SizeGuide> & Pick<SizeGuide, "id" | "title">,
): SizeGuide {
  return {
    brand: "Test",
    columns: [{ key: "chest", label: "Chest" }],
    rows: [{ size: "M", measurements: { chest: 100 } }],
    ...overrides,
  };
}

describe("normalizeGuideBrandSlug", () => {
  it("strips category suffixes from legacy slugs", () => {
    expect(normalizeGuideBrandSlug("johnny-reb-vests")).toBe("johnny-reb");
    expect(normalizeGuideBrandSlug("johnny-reb-vests-for-women")).toBe(
      "johnny-reb",
    );
  });
});

describe("buildSizeGuideRegistry", () => {
  it("indexes guides by canonical brand + category + gender", () => {
    const registry = buildSizeGuideRegistry([
      guide({
        id: "johnny-reb-vests",
        slug: "johnny-reb-vests",
        title: "Johnny Reb Vests for Men",
        brandSlug: "johnny-reb",
        category: "vests",
        gender: "men",
      }),
    ]);

    expect(
      registry.byBrandCategoryGender[sizeGuideLookupKey("johnny-reb", "vests", "men")]
        ?.title,
    ).toBe("Johnny Reb Vests for Men");
  });

  it("maps legacy brand slugs to canonical brand keys", () => {
    const registry = buildSizeGuideRegistry([
      guide({
        id: "legacy-women-vests",
        slug: "legacy-women-vests",
        title: "Legacy women vests",
        brandSlug: "johnny-reb-vests-for-women",
        category: "vests",
        gender: "women",
      }),
    ]);

    expect(
      registry.byBrandCategoryGender[
        sizeGuideLookupKey("johnny-reb", "vests", "women")
      ]?.title,
    ).toBe("Legacy women vests");
  });
});
