"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * WordPress uploads are full-size originals (often 100–300 KB JPEGs).
 * Vercel image optimization is unavailable on this project (quota → 402),
 * so remote images are resized/converted via the wsrv.nl proxy CDN instead.
 * Local /public assets are pre-sized and served as-is.
 */
const PROXIED_HOSTS = new Set([
  "shop.motorock.eu",
  "motorock.eu",
  "www.motorock.eu",
]);

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
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

  if (PROXIED_HOSTS.has(url.hostname)) {
    const target = encodeURIComponent(
      `${url.hostname}${url.pathname}${url.search}`,
    );
    return `https://wsrv.nl/?url=${target}&w=${width}&q=${quality ?? 75}&output=webp`;
  }

  return src;
}
