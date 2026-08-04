import { AI_PRODUCT_META_KEYS } from "@/lib/ai/domain/content-section";

type MetaEntry = {
  key: string;
  value: string | null;
};

export type AiProductSeoMeta = {
  title?: string;
  metaDescription?: string;
  keywords?: string[];
};

function readMetaValue(meta: readonly MetaEntry[] | null | undefined, key: string) {
  return meta?.find((entry) => entry.key === key)?.value ?? undefined;
}

function parseKeywords(raw: string | undefined) {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return undefined;
  }
}

export function parseAiProductSeoFromMeta(
  meta: readonly MetaEntry[] | null | undefined,
): AiProductSeoMeta | undefined {
  const title = readMetaValue(meta, AI_PRODUCT_META_KEYS.seoTitle)?.trim();
  const metaDescription = readMetaValue(
    meta,
    AI_PRODUCT_META_KEYS.seoMetaDescription,
  )?.trim();
  const keywords = parseKeywords(
    readMetaValue(meta, AI_PRODUCT_META_KEYS.seoKeywords),
  );

  if (!title && !metaDescription && !keywords?.length) {
    return undefined;
  }

  return {
    title: title || undefined,
    metaDescription: metaDescription || undefined,
    keywords,
  };
}
