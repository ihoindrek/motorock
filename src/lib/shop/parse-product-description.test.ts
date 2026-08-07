import { describe, expect, it } from "vitest";
import {
  hasRichHtmlDescription,
  resolveProductDescriptionHtml,
} from "@/lib/shop/parse-product-description";

describe("resolveProductDescriptionHtml", () => {
  it("prefers the long description", () => {
    expect(
      resolveProductDescriptionHtml(
        "<p>Long copy</p>",
        "<ul><li>Short list</li></ul>",
      ),
    ).toBe("<p>Long copy</p>");
  });

  it("falls back to short description when long is empty", () => {
    expect(
      resolveProductDescriptionHtml("", "<ul><li>Feature one</li></ul>"),
    ).toBe("<ul><li>Feature one</li></ul>");
  });
});

describe("hasRichHtmlDescription", () => {
  it("detects list markup", () => {
    expect(hasRichHtmlDescription("<ul><li>Item</li></ul>")).toBe(true);
  });
});
