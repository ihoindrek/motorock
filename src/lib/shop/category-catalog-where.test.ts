import { describe, expect, it } from "vitest";
import { resolveEquipmentCatalogWhere } from "@/lib/shop/category";

describe("resolveEquipmentCatalogWhere", () => {
  it("prefers Woo categoryId over slug for duplicate leaf slugs", () => {
    expect(
      resolveEquipmentCatalogWhere({
        title: "Rain Gear",
        description: "",
        breadcrumbs: [],
        wcCategorySlug: "rain-gear",
        wcCategoryId: 1797,
        wcCategoryPath: ["for-women", "rain-gear"],
        gender: "women",
      }),
    ).toEqual({ categoryId: 1797 });
  });

  it("falls back to slug when categoryId is unavailable", () => {
    expect(
      resolveEquipmentCatalogWhere({
        title: "Jackets and tags",
        description: "",
        breadcrumbs: [],
        wcCategorySlug: "jackets-and-tags-2",
        wcCategoryPath: ["for-women", "jackets-and-tags-2"],
        gender: "women",
      }),
    ).toEqual({ category: "jackets-and-tags-2" });
  });
});
