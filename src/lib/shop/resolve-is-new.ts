import type { ShowroomMetaSource } from "@/lib/shop/resolve-showroom-available";

/** Products published within this many days show the "New" badge automatically. */
export const NEW_PRODUCT_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const IS_NEW_META_KEYS = [
  "is_new",
  "_motorock_is_new",
  "motorock_is_new",
] as const;

export function parseIsNewMeta(value: string | undefined): boolean | null {
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

export function getIsNewFromMeta(
  meta:
    | ReadonlyArray<{ key: string; value: string | null | undefined }>
    | null
    | undefined,
): boolean | null {
  if (!meta?.length) {
    return null;
  }

  for (const key of IS_NEW_META_KEYS) {
    const entry = meta.find((item) => item.key === key);
    if (!entry) {
      continue;
    }

    const raw = entry.value == null ? undefined : String(entry.value);
    const parsed = parseIsNewMeta(raw);
    if (parsed !== null) {
      return parsed;
    }

    if (key === "is_new" && raw === "") {
      return false;
    }
  }

  return null;
}

export function isProductNewByPublishedDate(
  publishedAt: string | null | undefined,
  options?: { days?: number; now?: number },
): boolean {
  if (!publishedAt?.trim()) {
    return false;
  }

  const publishedMs = Date.parse(publishedAt);
  if (Number.isNaN(publishedMs)) {
    return false;
  }

  const days = options?.days ?? NEW_PRODUCT_DAYS;
  const now = options?.now ?? Date.now();

  return now - publishedMs <= days * MS_PER_DAY;
}

function isProductNewByPublishedDates(
  sources: readonly ShowroomMetaSource[],
  options?: { days?: number; now?: number },
): boolean {
  const timestamps = sources
    .map((source) => source.publishedAt)
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => Date.parse(value))
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return false;
  }

  const earliestPublishedMs = Math.min(...timestamps);

  return isProductNewByPublishedDate(new Date(earliestPublishedMs).toISOString(), {
    ...options,
    now: options?.now,
  });
}

export function resolveIsNewFromSources(
  ...sources: ShowroomMetaSource[]
): boolean {
  for (const source of sources) {
    const fromMeta = getIsNewFromMeta(source.meta);
    if (fromMeta !== null) {
      return fromMeta;
    }
  }

  return isProductNewByPublishedDates(sources);
}

export function resolveIsNew(
  meta?: ReadonlyArray<{ key: string; value: string | null | undefined }> | null,
  extraSources: readonly ShowroomMetaSource[] = [],
): boolean {
  return resolveIsNewFromSources({ meta }, ...extraSources);
}
