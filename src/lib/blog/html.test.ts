import { describe, expect, it } from "vitest";
import {
  cleanWordPressEllipsisInHtml,
  cleanWordPressEllipsisMarkers,
  stripHtml,
} from "@/lib/blog/html";

describe("WordPress ellipsis markers", () => {
  it("removes bracketed hellip from plain-text excerpts", () => {
    expect(
      stripHtml(
        "<p>The name comes from the Isle of Skye [&hellip;]</p>",
      ),
    ).toBe("The name comes from the Isle of Skye");
  });

  it("removes classic excerpt suffix variants", () => {
    expect(cleanWordPressEllipsisMarkers("Short intro [...]")).toBe(
      "Short intro",
    );
    expect(cleanWordPressEllipsisMarkers("Short intro […]")).toBe(
      "Short intro",
    );
  });

  it("removes markers from html without flattening tags", () => {
    expect(
      cleanWordPressEllipsisInHtml(
        "<p>Intro text [&hellip;]</p><p>Rest of article</p>",
      ),
    ).toBe("<p>Intro text</p><p>Rest of article</p>");
  });
});
