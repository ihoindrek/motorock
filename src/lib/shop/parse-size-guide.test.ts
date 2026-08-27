import { describe, expect, it } from "vitest";
import { parseRemoteSizeGuide } from "@/lib/shop/parse-size-guide";
import { sanitizeSizeGuideContentHtml } from "@/lib/shop/sanitize-size-guide-content";

describe("sanitizeSizeGuideContentHtml", () => {
  it("allows basic formatting tags", () => {
    expect(
      sanitizeSizeGuideContentHtml(
        "<p>Measure <strong>flat</strong>.</p><ul><li>Chest</li></ul>",
      ),
    ).toBe("<p>Measure <strong>flat</strong>.</p><ul><li>Chest</li></ul>");
  });

  it("strips scripts and event handlers", () => {
    expect(
      sanitizeSizeGuideContentHtml(
        '<p onclick="alert(1)">Hi</p><script>alert(1)</script>',
      ),
    ).toBe("<p>Hi</p>");
  });
});

describe("parseRemoteSizeGuide content fields", () => {
  it("maps optional image and rich text", () => {
    const guide = parseRemoteSizeGuide({
      id: "johnny-reb-vests",
      slug: "johnny-reb-vests",
      title: "Vests",
      brandSlug: "johnny-reb-vests",
      category: "vests",
      gender: "men",
      contentHtml: "<p>Measure over a thin shirt.</p>",
      imageUrl: "https://shop.motorock.eu/wp-content/uploads/vest-guide.jpg",
      columns: [{ key: "chest", label: "Chest" }],
      rows: [
        {
          size: "M",
          measurements: { chest: 112, hips: 104, length: 70 },
        },
      ],
    });

    expect(guide?.contentHtml).toBe("<p>Measure over a thin shirt.</p>");
    expect(guide?.imageUrl).toBe(
      "https://shop.motorock.eu/wp-content/uploads/vest-guide.jpg",
    );
  });
});
