export type ProductVideoProvider = "vimeo" | "youtube";

export type ProductVideo = {
  provider: ProductVideoProvider;
  id: string;
};

const VIMEO_ID_PATTERN =
  /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;

export function parseVimeoIdFromUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return undefined;
  }

  const match = url.trim().match(VIMEO_ID_PATTERN);
  return match?.[1];
}

export function parseYoutubeIdFromUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return undefined;
  }

  const match = url.trim().match(YOUTUBE_ID_PATTERN);
  return match?.[1];
}

export function parseProductVideoFromUrl(
  url: string | null | undefined,
): ProductVideo | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  const trimmed = url.trim();

  if (/^\d+$/.test(trimmed)) {
    return { provider: "vimeo", id: trimmed };
  }

  const vimeoId = parseVimeoIdFromUrl(trimmed);
  if (vimeoId) {
    return { provider: "vimeo", id: vimeoId };
  }

  const youtubeId = parseYoutubeIdFromUrl(trimmed);
  if (youtubeId) {
    return { provider: "youtube", id: youtubeId };
  }

  return undefined;
}

const PRODUCT_VIDEO_META_KEYS = [
  "product_video_url",
  "_motorock_vimeo_id",
  "motorock_vimeo_id",
  "vimeo_id",
] as const;

export function resolveProductVideoFromMeta(
  meta:
    | ReadonlyArray<{ key: string; value: string | null | undefined }>
    | null
    | undefined,
): ProductVideo | undefined {
  if (!meta?.length) {
    return undefined;
  }

  for (const key of PRODUCT_VIDEO_META_KEYS) {
    const entry = meta.find((item) => item.key === key);
    const raw = entry?.value == null ? undefined : String(entry.value).trim();

    if (!raw) {
      continue;
    }

    const parsed = parseProductVideoFromUrl(raw);
    if (parsed) {
      return parsed;
    }
  }

  return undefined;
}

/** @deprecated Use resolveProductVideoFromMeta */
export function resolveProductVimeoIdFromMeta(
  meta:
    | ReadonlyArray<{ key: string; value: string | null | undefined }>
    | null
    | undefined,
) {
  const video = resolveProductVideoFromMeta(meta);
  return video?.provider === "vimeo" ? video.id : undefined;
}

export function buildProductVideoEmbedUrl(video: ProductVideo) {
  if (video.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;
  }

  return `https://player.vimeo.com/video/${video.id}?autoplay=1&title=0&byline=0&portrait=0`;
}
