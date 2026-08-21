import { describe, expect, it } from "vitest";
import type { EquipmentCategoryIndex, WcCategoryEntry } from "@/lib/graphql/categories";
import type { CategoryRoute } from "@/lib/shop/category";
import { buildEquipmentSubcategories } from "@/lib/shop/equipment-subcategories";

function entry(
  slug: string,
  parentSlug: string | null,
  count = 1,
): WcCategoryEntry {
  return {
    slug,
    name: slug,
    parentSlug,
    count,
    languageCode: "en",
    translations: null,
    image: null,
  };
}

function accessoriesRoute(): CategoryRoute {
  return {
    title: "Accessories",
    description: "",
    wcCategoryPath: ["accessories"],
    wcCategorySlug: "accessories",
    accessoriesOnly: true,
  };
}

describe("buildEquipmentSubcategories", () => {
  it("prepends helmets on the accessories landing page", () => {
    const index: EquipmentCategoryIndex = {
      roots: ["accessories", "helmets"],
      nodes: new Map<string, WcCategoryEntry>([
        ["accessories", entry("accessories", null, 100)],
        ["helmets", entry("helmets", null, 42)],
        ["socks", entry("socks", "accessories", 7)],
        ["safety", entry("safety", "accessories", 21)],
      ]),
    };

    const subcategories = buildEquipmentSubcategories(
      accessoriesRoute(),
      index,
      "en",
    );

    expect(subcategories.map((subcategory) => subcategory.wcSlug)).toEqual([
      "helmets",
      "safety",
      "socks",
    ]);
    expect(subcategories[0]?.href).toBe("/shop/equipment/helmets");
  });

  it("does not duplicate helmet slugs nested under accessories", () => {
    const index: EquipmentCategoryIndex = {
      roots: ["accessories", "helmets"],
      nodes: new Map<string, WcCategoryEntry>([
        ["accessories", entry("accessories", null, 100)],
        ["helmets", entry("helmets", null, 42)],
        ["helmet-accessories", entry("helmet-accessories", "accessories", 5)],
      ]),
    };

    const subcategories = buildEquipmentSubcategories(
      accessoriesRoute(),
      index,
      "en",
    );

    expect(subcategories.map((subcategory) => subcategory.wcSlug)).toEqual([
      "helmets",
    ]);
  });
});
