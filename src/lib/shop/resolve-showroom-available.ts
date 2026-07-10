/**
 * Reads showroom availability from Woo product meta (ACF true/false field `showroom_available`).
 */
import { SHOWROOM_AVAILABLE_SLUGS } from "@/data/showroom-availability";

/** ACF field name first; legacy custom meta keys kept for backwards compatibility. */
const SHOWROOM_META_KEYS = [
  "showroom_available",
  "_motorock_showroom_available",
  "motorock_showroom_available",
] as const;

export type ShowroomMetaSource = {
  slug?: string | null;
  meta?: ReadonlyArray<{ key: string; value: string | null | undefined }> | null;
  /** WooCommerce publish date (ISO 8601). Used for automatic "New" badge window. */
  publishedAt?: string | null;
};

export function parseShowroomAvailableMeta(
  value: string | undefined,
): boolean | null {
  if (value === undefined || value === "") {
    return null;
  }

  const normalized = value.toLowerCase().trim();

  if (["1", "yes", "true", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "no", "false", "off"].includes(normalized)) {
    return false;
  }

  return null;
}

export function getShowroomAvailableFromMeta(
  meta:
    | ReadonlyArray<{ key: string; value: string | null | undefined }>
    | null
    | undefined,
): boolean | null {
  if (!meta?.length) {
    return null;
  }

  for (const key of SHOWROOM_META_KEYS) {
    const entry = meta.find((item) => item.key === key);
    if (!entry) {
      continue;
    }

    const raw = entry.value == null ? undefined : String(entry.value);
    const parsed = parseShowroomAvailableMeta(raw);
    if (parsed !== null) {
      return parsed;
    }

    // ACF true/false off — key exists but value is empty.
    if (key === "showroom_available" && raw === "") {
      return false;
    }
  }

  return null;
}

export function resolveShowroomAvailableFromSources(
  ...sources: ShowroomMetaSource[]
): boolean {
  for (const source of sources) {
    const fromMeta = getShowroomAvailableFromMeta(source.meta);
    if (fromMeta !== null) {
      return fromMeta;
    }
  }

  for (const source of sources) {
    if (source.slug && SHOWROOM_AVAILABLE_SLUGS.has(source.slug)) {
      return true;
    }
  }

  return false;
}

export function resolveShowroomAvailable(
  slug: string,
  meta?: ReadonlyArray<{ key: string; value: string | null | undefined }> | null,
  extraSources: readonly ShowroomMetaSource[] = [],
): boolean {
  return resolveShowroomAvailableFromSources(
    { slug, meta },
    ...extraSources,
  );
}

export function collectShowroomMetaSourcesFromSiblingProducts<
  T extends {
    slug?: string;
    databaseId?: number;
    metaData?: ReadonlyArray<{
      key: string;
      value: string | null | undefined;
    }> | null;
    date?: string | null;
    translations?: ReadonlyArray<{ databaseId?: number | null }> | null;
  },
>(product: T, productsById: ReadonlyMap<number, T>): ShowroomMetaSource[] {
  const sources: ShowroomMetaSource[] = [
    { slug: product.slug, meta: product.metaData, publishedAt: product.date },
  ];

  for (const translation of product.translations ?? []) {
    const databaseId = translation.databaseId;
    if (!databaseId) {
      continue;
    }

    const sibling = productsById.get(databaseId);
    if (sibling) {
      sources.push({
        slug: sibling.slug,
        meta: sibling.metaData,
        publishedAt: sibling.date,
      });
    }
  }

  return sources;
}
