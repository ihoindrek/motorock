const VIMEO_ID_PATTERN =
  /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i;

export function parseVimeoIdFromUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return undefined;
  }

  const match = url.trim().match(VIMEO_ID_PATTERN);
  return match?.[1];
}

const PRODUCT_VIDEO_META_KEYS = [
  "product_video_url",
  "_motorock_vimeo_id",
  "motorock_vimeo_id",
  "vimeo_id",
] as const;

export function resolveProductVimeoIdFromMeta(
  meta:
    | ReadonlyArray<{ key: string; value: string | null | undefined }>
    | null
    | undefined,
) {
  if (!meta?.length) {
    return undefined;
  }

  for (const key of PRODUCT_VIDEO_META_KEYS) {
    const entry = meta.find((item) => item.key === key);
    const raw = entry?.value == null ? undefined : String(entry.value).trim();

    if (!raw) {
      continue;
    }

    if (/^\d+$/.test(raw)) {
      return raw;
    }

    const fromUrl = parseVimeoIdFromUrl(raw);
    if (fromUrl) {
      return fromUrl;
    }
  }

  return undefined;
}
