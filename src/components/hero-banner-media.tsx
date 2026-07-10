"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

type HeroBannerMediaProps = {
  mobileImage: string;
  desktopPoster?: string;
  video?: string;
  imageSizes: string;
  priority?: boolean;
};

export function HeroBannerMedia({
  mobileImage,
  desktopPoster,
  video,
  imageSizes,
  priority = false,
}: HeroBannerMediaProps) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!video) {
      return;
    }

    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setShowVideo(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [video]);

  const mediaClass =
    "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105";

  if (showVideo && video) {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={desktopPoster ?? mobileImage}
        src={video}
        className={mediaClass}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={mobileImage}
      alt=""
      fill
      priority={priority}
      className={mediaClass}
      sizes={imageSizes}
    />
  );
}
