import { describe, expect, it } from "vitest";
import { splitBlogContentSegments } from "@/lib/blog/content-embeds";

describe("splitBlogContentSegments", () => {
  it("returns single html segment when no markers", () => {
    expect(splitBlogContentSegments("<p>Hello</p>")).toEqual([
      { type: "html", html: "<p>Hello</p>" },
    ]);
  });

  it("splits product markers into segments", () => {
    const html =
      '<h2>Guide</h2><p>Intro</p>[motorock_products slugs="helmet-x, jacket-y"]<p>Outro</p>';

    expect(splitBlogContentSegments(html)).toEqual([
      { type: "html", html: "<h2>Guide</h2><p>Intro</p>" },
      { type: "products", slugs: ["helmet-x", "jacket-y"] },
      { type: "html", html: "<p>Outro</p>" },
    ]);
  });

  it("handles wpautop-wrapped markers and encoded quotes", () => {
    const html =
      "<p>Before</p><p>[motorock_products slugs=&quot;boots-z&quot;]</p><p>After</p>";

    const segments = splitBlogContentSegments(html);
    expect(segments).toEqual([
      { type: "html", html: "<p>Before</p>" },
      { type: "products", slugs: ["boots-z"] },
      { type: "html", html: "<p>After</p>" },
    ]);
  });

  it("drops invalid slugs", () => {
    const segments = splitBlogContentSegments(
      '[motorock_products slugs="ok-slug,<bad>,also-ok"]',
    );

    expect(segments).toEqual([
      { type: "products", slugs: ["ok-slug", "also-ok"] },
    ]);
  });
});
