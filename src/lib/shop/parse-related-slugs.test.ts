import { describe, expect, it } from "vitest";
import { parseRelatedSlugsFromMeta } from "@/lib/shop/parse-related-slugs";

describe("parseRelatedSlugsFromMeta", () => {
  it("parses JSON slug array", () => {
    expect(
      parseRelatedSlugsFromMeta([
        {
          key: "_motorock_related_slugs",
          value: '["revolver-125","crossfire-500"]',
        },
      ]),
    ).toEqual(["revolver-125", "crossfire-500"]);
  });

  it("returns undefined for empty or invalid meta", () => {
    expect(parseRelatedSlugsFromMeta([])).toBeUndefined();
    expect(
      parseRelatedSlugsFromMeta([
        { key: "_motorock_related_slugs", value: "not-json" },
      ]),
    ).toBeUndefined();
  });
});
