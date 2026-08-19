import { describe, expect, it } from "vitest";
import {
  equipmentSlugSegmentsMatch,
  normalizeEquipmentSlugSegments,
} from "@/lib/shop/equipment-route";
import { resolveEncodedSlashEquipmentPath } from "@/lib/shop/category-url";

describe("normalizeEquipmentSlugSegments", () => {
  it("splits encoded slash segments into nested category slugs", () => {
    expect(
      normalizeEquipmentSlugSegments(["meestele%2Fkapuutsid-ja-kampsunid"]),
    ).toEqual(["meestele", "kapuutsid-ja-kampsunid"]);
  });

  it("keeps already-normalized slug arrays unchanged", () => {
    expect(
      normalizeEquipmentSlugSegments(["meestele", "kapuutsid-ja-kampsunid"]),
    ).toEqual(["meestele", "kapuutsid-ja-kampsunid"]);
  });
});

describe("equipmentSlugSegmentsMatch", () => {
  it("detects normalized slug differences", () => {
    expect(
      equipmentSlugSegmentsMatch(
        ["meestele", "kapuutsid-ja-kampsunid"],
        ["meestele%2Fkapuutsid-ja-kampsunid"],
      ),
    ).toBe(false);
  });
});

describe("resolveEncodedSlashEquipmentPath", () => {
  it("rewrites encoded equipment category paths", () => {
    expect(
      resolveEncodedSlashEquipmentPath(
        "/tootekategooria/meestele%2Fkapuutsid-ja-kampsunid",
      ),
    ).toBe("/tootekategooria/meestele/kapuutsid-ja-kampsunid");
  });
});
