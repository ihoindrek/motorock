import { AI_PRODUCT_META_KEYS } from "@/lib/ai/domain/content-section";
import type { ProductFaqItem } from "@/lib/ai/core/types";

type MetaEntry = {
  key: string;
  value: string | null;
};

function readMetaValue(meta: readonly MetaEntry[] | null | undefined, key: string) {
  return meta?.find((entry) => entry.key === key)?.value ?? undefined;
}

function parseJsonArray<T>(raw: string | undefined, guard: (value: unknown) => value is T) {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter(guard);
  } catch {
    return undefined;
  }
}

function isFaqItem(value: unknown): value is ProductFaqItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ProductFaqItem>;
  return (
    typeof item.question === "string" &&
    typeof item.answer === "string" &&
    item.question.trim().length >= 10 &&
    item.answer.trim().length >= 20
  );
}

export function isAiContentPublished(
  meta: readonly MetaEntry[] | null | undefined,
): boolean {
  const status = readMetaValue(meta, AI_PRODUCT_META_KEYS.contentStatus)?.trim();
  return !status || status === "published";
}

export function parseAiProductFaqFromMeta(
  meta: readonly MetaEntry[] | null | undefined,
): ProductFaqItem[] | undefined {
  if (!isAiContentPublished(meta)) {
    return undefined;
  }

  const items = parseJsonArray(
    readMetaValue(meta, AI_PRODUCT_META_KEYS.faq),
    isFaqItem,
  );

  if (!items?.length) {
    return undefined;
  }

  return items;
}

export function parseAiDraftProductFaqFromMeta(
  meta: readonly MetaEntry[] | null | undefined,
): ProductFaqItem[] | undefined {
  const items = parseJsonArray(
    readMetaValue(meta, AI_PRODUCT_META_KEYS.draftFaq),
    isFaqItem,
  );

  if (!items?.length) {
    return undefined;
  }

  return items;
}
