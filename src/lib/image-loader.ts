"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * WordPress uploads are full-size originals (often 100–300 KB JPEGs).
 * Vercel image optimization is unavailable on this project (quota → 402),
 * so remote images are resized/converted via the wsrv.nl proxy CDN instead.
 * Local /public assets are served as-is.
 */
const PROXIED_HOSTS = new Set([
  "shop.motorock.eu",
  "motorock.eu",
  "www.motorock.eu",
]);

/** Matches Tailwind `moto` token — wsrv fills PNG alpha before WebP encode. */
export const MOTO_STAGE_WSRV_BG = "c8c8c8";

type WsrvStageBackground = "moto";

type BuildWsrvUrlOptions = {
  stageBackground?: WsrvStageBackground;
};

export function buildWsrvUrl(
  src: string,
  width: number,
  quality?: number,
  options?: BuildWsrvUrlOptions,
) {
  if (src.startsWith("/")) {
    return src;
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  if (!PROXIED_HOSTS.has(url.hostname)) {
    return src;
  }

  const target = encodeURIComponent(
    `${url.hostname}${url.pathname}${url.search}`,
  );
  const parts = [
    `url=${target}`,
    `w=${width}`,
    `q=${quality ?? 75}`,
    "output=webp",
  ];

  if (options?.stageBackground === "moto") {
    parts.push(`bg=${MOTO_STAGE_WSRV_BG}`);
  }

  return `https://wsrv.nl/?${parts.join("&")}`;
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  return buildWsrvUrl(src, width, quality);
}

/** Motorcycle catalog/PDP — pre-fill PNG transparency with the moto stage gray. */
export function motoStageImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  return buildWsrvUrl(src, width, quality, { stageBackground: "moto" });
}
