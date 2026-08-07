import { describe, expect, it } from "vitest";
import {
  buildProductVideoEmbedUrl,
  parseProductVideoFromUrl,
  parseYoutubeIdFromUrl,
  parseVimeoIdFromUrl,
  resolveProductVideoFromMeta,
  resolveProductVideoFromSources,
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

  it("parses unlisted Vimeo URLs with privacy hash", () => {
    expect(
      parseProductVideoFromUrl("https://vimeo.com/601661275/d9c6026f1f?fl=pl&fe=sh"),
    ).toEqual({
      provider: "vimeo",
      id: "601661275",
      privacyHash: "d9c6026f1f",
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

  it("parses direct video file URLs", () => {
    const url =
      "https://cms.brixton-motorcycles.com/wp-content/uploads/2018/11/500x1.mp4";
    expect(parseProductVideoFromUrl(url)).toEqual({
      provider: "file",
      id: url,
    });
    expect(
      parseProductVideoFromUrl("https://example.com/clips/promo.webm?download=1"),
    ).toEqual({
      provider: "file",
      id: "https://example.com/clips/promo.webm?download=1",
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

describe("resolveProductVideoFromSources", () => {
  it("falls back to sibling translation meta", () => {
    expect(
      resolveProductVideoFromSources(
        { meta: [] },
        {
          meta: [
            {
              key: "product_video_url",
              value: "https://vimeo.com/601661275/d9c6026f1f",
            },
          ],
        },
      ),
    ).toEqual({
      provider: "vimeo",
      id: "601661275",
      privacyHash: "d9c6026f1f",
    });
  });
});

describe("buildProductVideoEmbedUrl", () => {
  it("builds provider-specific embed URLs", () => {
    expect(
      buildProductVideoEmbedUrl({
        provider: "vimeo",
        id: "601661275",
        privacyHash: "d9c6026f1f",
      }),
    ).toContain("h=d9c6026f1f");
    expect(
      buildProductVideoEmbedUrl({ provider: "youtube", id: "abc12345678" }),
    ).toContain("youtube-nocookie.com/embed/abc12345678");
    expect(
      buildProductVideoEmbedUrl({
        provider: "file",
        id: "https://example.com/video.mp4",
      }),
    ).toBe("https://example.com/video.mp4");
  });
});
