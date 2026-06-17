"use client";

import { ProductImageGallery } from "@/components/shop/product-image-gallery";

type MotorcycleProductGalleryProps = {
  images: readonly string[];
  alt: string;
  preferredImage?: string;
  layout?: "default" | "hero";
  vimeoId?: string;
  videoTitle?: string;
  inStoreNow?: boolean;
};

export function MotorcycleProductGallery({
  images,
  alt,
  preferredImage,
  layout = "default",
  vimeoId,
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
      vimeoId={vimeoId}
      videoTitle={videoTitle}
      inStoreNow={inStoreNow}
      fullBleedMobile
    />
  );
}
