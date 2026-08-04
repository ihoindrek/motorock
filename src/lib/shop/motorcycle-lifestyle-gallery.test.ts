import { describe, expect, it } from "vitest";

import { normalizeMotorcycleContent } from "@/lib/shop/normalize-motorcycle-content";
import {
  parseMotorcycleLifestyleGalleryJson,
  resolveMotorcycleLifestyleGalleryUrls,
} from "@/lib/shop/motorcycle-lifestyle-gallery";

describe("motorcycle lifestyle gallery", () => {
  it("parses JSON URL list from meta", () => {
    expect(
      parseMotorcycleLifestyleGalleryJson(
        JSON.stringify([
          "https://shop.motorock.eu/wp-content/uploads/2026/02/ride-1.jpg",
          "https://shop.motorock.eu/wp-content/uploads/2026/02/ride-2.jpg",
        ]),
      ),
    ).toEqual([
      "https://shop.motorock.eu/wp-content/uploads/2026/02/ride-1.jpg",
      "https://shop.motorock.eu/wp-content/uploads/2026/02/ride-2.jpg",
    ]);
  });

  it("falls back from empty ET meta to EN lifestyle gallery", () => {
    const enMeta = [
      {
        key: "_motorock_lifestyle_gallery",
        value: JSON.stringify([
          "https://shop.motorock.eu/wp-content/uploads/2026/02/en-lifestyle.jpg",
        ]),
      },
    ];

    const urls = resolveMotorcycleLifestyleGalleryUrls({
      meta: [],
      metaSources: [
        { slug: "malaguti-xtm-125-et" },
        { slug: "malaguti-xtm-125", meta: enMeta },
      ],
    });

    expect(urls).toEqual([
      "https://shop.motorock.eu/wp-content/uploads/2026/02/en-lifestyle.jpg",
    ]);
  });

  it("builds parallax only from dedicated lifestyle gallery", () => {
    const content = normalizeMotorcycleContent({
      shortHtml: "",
      longHtml: "",
      productImages: [
        "https://shop.motorock.eu/wp-content/uploads/2026/02/studio-1.jpg",
        "https://shop.motorock.eu/wp-content/uploads/2026/02/studio-2.jpg",
      ],
      lifestyleGallery: [
        "https://shop.motorock.eu/wp-content/uploads/2026/02/lifestyle-1.jpg",
      ],
      productName: "XTM 125",
      brand: "Malaguti",
    });

    expect(content.parallaxImages).toEqual([
      {
        src: "https://shop.motorock.eu/wp-content/uploads/2026/02/lifestyle-1.jpg",
        alt: "Malaguti XTM 125",
      },
    ]);
  });
});
