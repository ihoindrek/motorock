import { describe, expect, it } from "vitest";
import {
  buildGallerySlides,
  imageIndexToSlideIndex,
  slideIndexToLightboxImageIndex,
} from "@/components/shop/gallery-video-slide";

describe("gallery slides", () => {
  const images = ["a.jpg", "b.jpg", "c.jpg"];

  it("places video after the hero image", () => {
    expect(buildGallerySlides(images, true)).toEqual([
      { kind: "image", src: "a.jpg" },
      { kind: "video" },
      { kind: "image", src: "b.jpg" },
      { kind: "image", src: "c.jpg" },
    ]);
  });

  it("maps image indices to slide indices", () => {
    const slides = buildGallerySlides(images, true);
    expect(imageIndexToSlideIndex(0, slides)).toBe(0);
    expect(imageIndexToSlideIndex(1, slides)).toBe(2);
    expect(imageIndexToSlideIndex(2, slides)).toBe(3);
  });

  it("maps slide indices to lightbox image indices", () => {
    const slides = buildGallerySlides(images, true);
    expect(slideIndexToLightboxImageIndex(1, slides)).toBe(0);
    expect(slideIndexToLightboxImageIndex(2, slides)).toBe(1);
  });
});
