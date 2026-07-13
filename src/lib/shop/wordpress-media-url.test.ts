import { describe, expect, it } from "vitest";
import { normalizeWordPressMediaUrl } from "@/lib/shop/wordpress-media-url";

describe("normalizeWordPressMediaUrl", () => {
  it("rewrites legacy motorock.eu media to shop", () => {
    expect(
      normalizeWordPressMediaUrl(
        "https://motorock.eu/wp-content/uploads/2026/03/rayburn.jpg",
      ),
    ).toBe(
      "https://shop.motorock.eu/wp-content/uploads/2026/03/rayburn.jpg",
    );
  });

  it("prefixes relative wp-content paths", () => {
    expect(normalizeWordPressMediaUrl("/wp-content/uploads/x.webp")).toBe(
      "https://shop.motorock.eu/wp-content/uploads/x.webp",
    );
  });

  it("leaves local public paths unchanged", () => {
    expect(normalizeWordPressMediaUrl("/brixton-image.webp")).toBe(
      "/brixton-image.webp",
    );
  });
});
