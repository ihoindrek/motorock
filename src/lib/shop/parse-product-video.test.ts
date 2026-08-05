import { describe, expect, it } from "vitest";
import {
  buildProductVideoEmbedUrl,
  parseProductVideoFromUrl,
  parseYoutubeIdFromUrl,
  parseVimeoIdFromUrl,
  resolveProductVideoFromMeta,
} from "@/lib/shop/parse-product-video";

describe("parseProductVideoFromUrl", () => {
  it("parses Vimeo URLs and raw IDs", () => {
    expect(parseProductVideoFromUrl("https://vimeo.com/123456789")).toEqual({
      provider: "vimeo",
      id: "123456789",
    });
    expect(parseProductVideoFromUrl("123456789")).toEqual({
      provider: "vimeo",
      id: "123456789",
    });
  });

  it("parses YouTube URLs", () => {
    expect(
      parseProductVideoFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(parseProductVideoFromUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(
      parseProductVideoFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });
});

describe("parseVimeoIdFromUrl", () => {
  it("extracts Vimeo ID", () => {
    expect(parseVimeoIdFromUrl("https://player.vimeo.com/video/987654321")).toBe(
      "987654321",
    );
  });
});

describe("parseYoutubeIdFromUrl", () => {
  it("extracts YouTube ID", () => {
    expect(parseYoutubeIdFromUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });
});

describe("resolveProductVideoFromMeta", () => {
  it("reads product_video_url meta", () => {
    expect(
      resolveProductVideoFromMeta([
        {
          key: "product_video_url",
          value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ]),
    ).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });
});

describe("buildProductVideoEmbedUrl", () => {
  it("builds provider-specific embed URLs", () => {
    expect(
      buildProductVideoEmbedUrl({ provider: "vimeo", id: "123" }),
    ).toContain("player.vimeo.com/video/123");
    expect(
      buildProductVideoEmbedUrl({ provider: "youtube", id: "abc12345678" }),
    ).toContain("youtube-nocookie.com/embed/abc12345678");
  });
});
