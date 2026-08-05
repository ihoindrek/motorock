"use client";

import type { ProductVideo } from "@/lib/shop/parse-product-video";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";

type MotorcycleProductGalleryProps = {
  images: readonly string[];
  alt: string;
  preferredImage?: string;
  layout?: "default" | "hero";
  productVideo?: ProductVideo;
  videoTitle?: string;
  inStoreNow?: boolean;
};

export function MotorcycleProductGallery({
  images,
  alt,
  preferredImage,
  layout = "default",
  productVideo,
  videoTitle,
  inStoreNow,
}: MotorcycleProductGalleryProps) {
  return (
    <ProductImageGallery
      images={images}
      alt={alt}
      preferredImage={preferredImage}
      variant="product"
      theme="light"
      layout={layout === "hero" ? "hero" : "compact"}
      productVideo={productVideo}
      videoTitle={videoTitle}
      inStoreNow={inStoreNow}
      fullBleedMobile
    />
  );
}
