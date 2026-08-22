import { describe, expect, it } from "vitest";
import {
  buildIndexFromNavTree,
  resolveCategoryPath,
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
