import type { GraphQLMetaData } from "@/lib/graphql/types";

export const MOTOROCK_RELATED_SLUGS_META_KEY = "_motorock_related_slugs";

function readMetaValue(meta: GraphQLMetaData[] | null | undefined, key: string) {
  return meta?.find((entry) => entry.key === key)?.value ?? undefined;
}

export function parseRelatedSlugsFromMeta(
  meta: GraphQLMetaData[] | null | undefined,
): string[] | undefined {
  const raw = readMetaValue(meta, MOTOROCK_RELATED_SLUGS_META_KEY);
  if (!raw?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const slugs = parsed
      .filter((value): value is string => typeof value === "string")
      .map((slug) => slug.trim())
      .filter(Boolean);

    return slugs.length > 0 ? slugs : undefined;
  } catch {
    return undefined;
  }
}
