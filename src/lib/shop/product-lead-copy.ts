import { decodeHtmlEntities } from "@/lib/html/decode-html-entities";

export function htmlToPlainText(html: string) {
  return decodeHtmlEntities(
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

/** Split prose into sentences without breaking words (EN/ET friendly). */
export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const parts =
    normalized.match(/[^.!?…]+[.!?…]+(?:["'»)]|\s*)|[^.!?…]+$/g) ?? [normalized];

  return parts.map((part) => part.trim()).filter(Boolean);
}

type ExtractLeadCopyOptions = {
  /** When short description is empty, take this many full sentences from long copy. */
  fallbackMaxSentences?: number;
  fallbackPlain?: string;
};

/**
 * Plain-text lead copy for product headers: full short description when present,
 * otherwise the first complete sentences from long description (never mid-word).
 */
export function extractLeadCopy(
  shortHtml: string | undefined | null,
  options?: ExtractLeadCopyOptions,
): string | undefined {
  if (shortHtml?.trim()) {
    const plain = htmlToPlainText(shortHtml);
    return plain || undefined;
  }

  const fallback = options?.fallbackPlain?.trim();

  if (!fallback) {
    return undefined;
  }

  const maxSentences = options?.fallbackMaxSentences ?? 2;
  const sentences = splitSentences(fallback);

  if (sentences.length === 0) {
    return fallback;
  }

  return sentences.slice(0, maxSentences).join(" ");
}

export function resolveProductLeadCopy(
  parsedTagline: string | undefined,
  shortHtml: string,
  longPlain: string,
): string | undefined {
  if (parsedTagline?.trim()) {
    return decodeHtmlEntities(parsedTagline.trim());
  }

  return extractLeadCopy(shortHtml, {
    fallbackPlain: longPlain,
    fallbackMaxSentences: 2,
  });
}
