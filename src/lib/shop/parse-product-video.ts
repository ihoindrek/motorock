export type ProductVideoProvider = "vimeo" | "youtube" | "file";

export type ProductVideo = {
  provider: ProductVideoProvider;
  /** Vimeo/YouTube ID, or a direct video file URL when provider is `file`. */
  id: string;
  /** Required for some unlisted Vimeo URLs (`vimeo.com/{id}/{hash}`). */
  privacyHash?: string;
};

const VIMEO_URL_PATTERN =
  /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-f0-9]+))?/i;

const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;

const DIRECT_VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v|ogv)(?:$|[?#])/i;

export function isDirectVideoFileUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      DIRECT_VIDEO_FILE_PATTERN.test(parsed.pathname + parsed.search + parsed.hash)
    );
  } catch {
    return DIRECT_VIDEO_FILE_PATTERN.test(url.trim());
  }
}

export function parseVimeoIdFromUrl(url: string | null | undefined) {
  const video = parseProductVideoFromUrl(url);
  return video?.provider === "vimeo" ? video.id : undefined;
}

export function parseYoutubeIdFromUrl(url: string | null | undefined) {
  const video = parseProductVideoFromUrl(url);
  return video?.provider === "youtube" ? video.id : undefined;
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

  const vimeoMatch = trimmed.match(VIMEO_URL_PATTERN);
  if (vimeoMatch?.[1]) {
    return {
      provider: "vimeo",
      id: vimeoMatch[1],
      privacyHash: vimeoMatch[2] || undefined,
    };
  }

  const youtubeMatch = trimmed.match(YOUTUBE_ID_PATTERN);
  if (youtubeMatch?.[1]) {
    return { provider: "youtube", id: youtubeMatch[1] };
  }

  if (isDirectVideoFileUrl(trimmed)) {
    return { provider: "file", id: trimmed };
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

export function resolveProductVideoFromSources(
  ...sources: ReadonlyArray<{
    meta?:
      | ReadonlyArray<{ key: string; value: string | null | undefined }>
      | null
      | undefined;
  }>
): ProductVideo | undefined {
  for (const source of sources) {
    const video = resolveProductVideoFromMeta(source.meta);
    if (video) {
      return video;
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
  if (video.provider === "file") {
    return video.id;
  }

  if (video.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    title: "0",
    byline: "0",
    portrait: "0",
  });

  if (video.privacyHash) {
    params.set("h", video.privacyHash);
  }

  return `https://player.vimeo.com/video/${video.id}?${params.toString()}`;
}
