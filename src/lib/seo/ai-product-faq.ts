import { AI_PRODUCT_META_KEYS } from "@/lib/ai/domain/content-section";
import type { ProductFaqItem } from "@/lib/ai/core/types";

type MetaEntry = {
  key: string;
  value: string | null;
};

/** Repair FAQ text when WP meta stripped backslashes from JSON \\uXXXX escapes. */
export function repairStoredUnicodeText(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/u([0-9a-fA-F]{4})/g, (match, hex: string) => {
      const code = Number.parseInt(hex, 16);
      if (code >= 0x00a0 && code <= 0x024f) {
        return String.fromCodePoint(code);
      }

      return match;
    });
}

function readMetaValue(meta: readonly MetaEntry[] | null | undefined, key: string) {
  return meta?.find((entry) => entry.key === key)?.value ?? undefined;
}

function normalizeFaqItem(value: unknown): ProductFaqItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<ProductFaqItem>;
  if (typeof item.question !== "string" || typeof item.answer !== "string") {
    return null;
  }

  const question = repairStoredUnicodeText(item.question.trim());
  const answer = repairStoredUnicodeText(item.answer.trim());

  if (question.length < 10 || answer.length < 20) {
    return null;
  }

  return { question, answer };
}

function parseJsonArray(raw: string | undefined): ProductFaqItem[] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const items = parsed
      .map((entry) => normalizeFaqItem(entry))
      .filter((entry): entry is ProductFaqItem => entry !== null);

    return items.length > 0 ? items : undefined;
  } catch {
    return undefined;
  }
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

  return parseJsonArray(readMetaValue(meta, AI_PRODUCT_META_KEYS.faq));
}

export function parseAiDraftProductFaqFromMeta(
  meta: readonly MetaEntry[] | null | undefined,
): ProductFaqItem[] | undefined {
  return parseJsonArray(readMetaValue(meta, AI_PRODUCT_META_KEYS.draftFaq));
}
