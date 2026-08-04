import { normalizeWordPressMediaUrls } from "@/lib/shop/wordpress-media-url";
import type { ShowroomMetaSource } from "@/lib/shop/resolve-showroom-available";

export const MOTORCYCLE_LIFESTYLE_GALLERY_META_KEY = "_motorock_lifestyle_gallery";

type MetaEntry = {
  key?: string | null;
  value?: string | null;
};

function readMetaString(
  meta: readonly MetaEntry[] | null | undefined,
  key: string,
): string | null {
  const value = meta?.find((entry) => entry.key === key)?.value?.trim();
  return value || null;
}

export function parseMotorcycleLifestyleGalleryJson(
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const urls = parsed.filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );

    return normalizeWordPressMediaUrls(urls);
  } catch {
    return [];
  }
}

export function parseMotorcycleLifestyleGalleryFromMeta(
  meta: readonly MetaEntry[] | null | undefined,
): string[] {
  return parseMotorcycleLifestyleGalleryJson(
    readMetaString(meta, MOTORCYCLE_LIFESTYLE_GALLERY_META_KEY),
  );
}

/**
 * Uses the current product meta first, then WPML sibling metas (EN when ET is empty).
 * Upload lifestyle images once on the EN product — ET PDP reuses them automatically.
 */
export function resolveMotorcycleLifestyleGalleryUrls(input: {
  meta?: readonly MetaEntry[] | null;
  metaSources?: readonly ShowroomMetaSource[];
}): string[] {
  const candidates = [
    input.meta,
    ...(input.metaSources?.map((source) => source.meta) ?? []),
  ].filter((meta): meta is readonly MetaEntry[] => Boolean(meta?.length));

  const seen = new Set<readonly MetaEntry[]>();

  for (const meta of candidates) {
    if (seen.has(meta)) {
      continue;
    }

    seen.add(meta);

    const urls = parseMotorcycleLifestyleGalleryFromMeta(meta);
    if (urls.length > 0) {
      return urls;
    }
  }

  return [];
}
