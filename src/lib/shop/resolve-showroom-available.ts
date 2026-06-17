import { SHOWROOM_AVAILABLE_SLUGS } from "@/data/showroom-availability";

const SHOWROOM_META_KEYS = [
  "_motorock_showroom_available",
  "showroom_available",
  "motorock_showroom_available",
] as const;

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
    const parsed = parseShowroomAvailableMeta(
      entry?.value == null ? undefined : String(entry.value),
    );
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

export function resolveShowroomAvailable(
  slug: string,
  meta?: ReadonlyArray<{ key: string; value: string | null | undefined }> | null,
): boolean {
  const fromMeta = getShowroomAvailableFromMeta(meta);
  if (fromMeta !== null) {
    return fromMeta;
  }

  return SHOWROOM_AVAILABLE_SLUGS.has(slug);
}
