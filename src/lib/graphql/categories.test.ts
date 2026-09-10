import { describe, expect, it } from "vitest";
import {
  buildIndex,
  buildIndexFromNavTree,
  resolveCategoryPath,
  resolveLocalizedCategoryPath,
} from "@/lib/graphql/categories";

describe("buildIndexFromNavTree", () => {
  it("resolves nested accessories paths when the full index query fails", () => {
    const index = buildIndexFromNavTree({
      forMen: { nodes: [] },
      forWomen: { nodes: [] },
      accessories: {
        nodes: [
          {
            slug: "accessories",
            name: "Accessories",
            children: {
              nodes: [
                {
                  slug: "goggles",
                  name: "Goggles",
                  count: 12,
                },
              ],
            },
          },
        ],
      },
      helmets: { nodes: [] },
    });

    expect(resolveCategoryPath(index, ["accessories", "goggles"])).toEqual([
      expect.objectContaining({ slug: "accessories", parentSlug: null }),
      expect.objectContaining({ slug: "goggles", parentSlug: "accessories" }),
    ]);
  });
});

describe("buildIndex", () => {
  it("keeps duplicate child slugs under different parents", () => {
    const index = buildIndex([
      {
        slug: "for-men",
        name: "For men",
        parent: null,
      },
      {
        slug: "for-women",
        name: "For women",
        parent: null,
      },
      {
        slug: "rain-gear",
        name: "Rain Gear",
        parent: { node: { slug: "for-men" } },
      },
      {
        slug: "rain-gear-2",
        name: "Rain Gear",
        parent: { node: { slug: "for-women" } },
      },
    ]);

    expect(resolveCategoryPath(index, ["for-men", "rain-gear"])).toEqual([
      expect.objectContaining({ slug: "for-men", parentSlug: null }),
      expect.objectContaining({ slug: "rain-gear", parentSlug: "for-men" }),
    ]);
    expect(resolveCategoryPath(index, ["for-women", "rain-gear-2"])).toEqual([
      expect.objectContaining({ slug: "for-women", parentSlug: null }),
      expect.objectContaining({ slug: "rain-gear-2", parentSlug: "for-women" }),
    ]);
    expect(
      resolveLocalizedCategoryPath(index, ["for-women", "rain-gear-2"], "en"),
    ).toEqual([
      expect.objectContaining({ slug: "for-women", parentSlug: null }),
      expect.objectContaining({ slug: "rain-gear-2", parentSlug: "for-women" }),
    ]);
  });
});
