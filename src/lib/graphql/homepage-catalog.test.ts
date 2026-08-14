import { describe, expect, it } from "vitest";
import type { GraphQLProductCard } from "@/lib/graphql/types";

function mergeCatalogNodeMaps(
  ...maps: readonly Map<number, GraphQLProductCard>[]
): Map<number, GraphQLProductCard> {
  const merged = new Map<number, GraphQLProductCard>();

  for (const map of maps) {
    for (const [databaseId, node] of map) {
      merged.set(databaseId, node);
    }
  }

  return merged;
}

describe("homepage catalog helpers", () => {
  it("merges catalog node maps without object-spread data loss", () => {
    const left = new Map<number, GraphQLProductCard>([
      [1, { databaseId: 1, slug: "left", name: "Left" } as GraphQLProductCard],
    ]);
    const right = new Map<number, GraphQLProductCard>([
      [2, { databaseId: 2, slug: "right", name: "Right" } as GraphQLProductCard],
    ]);

    const brokenSpread = {
      ...left,
      ...right,
    };

    expect(Object.keys(brokenSpread)).toHaveLength(0);

    const merged = mergeCatalogNodeMaps(left, right);
    expect([...merged.keys()]).toEqual([1, 2]);
  });
});
