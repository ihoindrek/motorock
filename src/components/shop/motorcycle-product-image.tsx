"use client";

import {
  buildMotoImageSrcSet,
  motoStageImageLoader,
} from "@/lib/image-loader";

const DEFAULT_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

type MotorcycleProductImageProps = {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
};

/**
 * Native <img> for motorcycle stages — Next/Image's wrapper span breaks
 * mix-blend-multiply against bg-moto for JPEG studio shots.
 */
export function MotorcycleProductImage({
  src,
  alt = "",
  className = "",
  sizes = DEFAULT_SIZES,
  loading = "lazy",
  priority = false,
}: MotorcycleProductImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- blend requires no Next wrapper
    <img
      src={motoStageImageLoader({ src, width: 1080 })}
      srcSet={buildMotoImageSrcSet(src)}
      sizes={sizes}
      alt={alt}
      decoding="async"
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}
