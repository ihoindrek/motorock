import { describe, expect, it } from "vitest";
import { catalogProductGridClassName } from "@/lib/shop/product-grid-layout";

describe("catalogProductGridClassName", () => {
  it("uses a sparse desktop layout for short motorcycle result sets", () => {
    expect(
      catalogProductGridClassName(3, { sparseDesktopCount: 1 }),
    ).toContain("lg:grid-cols-1");
    expect(
      catalogProductGridClassName(3, { sparseDesktopCount: 2 }),
    ).toContain("lg:grid-cols-2");
  });

  it("keeps the default three-column desktop layout for larger sets", () => {
    expect(catalogProductGridClassName(3)).toContain("lg:grid-cols-3");
    expect(
      catalogProductGridClassName(3, { sparseDesktopCount: 3 }),
    ).toContain("lg:grid-cols-3");
  });
});
