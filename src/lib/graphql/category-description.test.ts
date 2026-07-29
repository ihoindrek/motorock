import { describe, expect, it } from "vitest";
import {
  plainTextFromHtml,
  sanitizeCategoryDescriptionHtml,
} from "@/lib/graphql/categories";

describe("category description HTML", () => {
  it("keeps strong tags and strips scripts", () => {
    const html =
      "<strong>Motorcycle gear designed for women riders</strong> — jackets. <script>alert(1)</script>";

    expect(sanitizeCategoryDescriptionHtml(html)).toBe(
      "<strong>Motorcycle gear designed for women riders</strong> — jackets.",
    );
  });

  it("plain text strips tags for metadata", () => {
    expect(
      plainTextFromHtml(
        "<strong>Motorcycle gear designed for women riders</strong> — jackets.",
      ),
    ).toBe("Motorcycle gear designed for women riders — jackets.");
  });

  it("strips anchor tags from category blurbs", () => {
    expect(
      sanitizeCategoryDescriptionHtml(
        '<a href="/relative">Loe edasi</a> and <a href="https://example.com">link</a>.',
      ),
    ).toBe("Loe edasi and link .");
  });
});
