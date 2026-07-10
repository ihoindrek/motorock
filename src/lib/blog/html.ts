import type { Locale } from "@/i18n/config";
import { buildProductHref } from "@/lib/shop/product-url";

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#8217;": "'",
  "&#8216;": "'",
  "&#8220;": '"',
  "&#8221;": '"',
  "&#8230;": "…",
};

export function stripHtml(html: string): string {
  return decodeBasicHtmlEntities(
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function decodeBasicHtmlEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (match) => HTML_ENTITY_MAP[match] ?? match);
}

export function estimateReadTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function rewriteBlogContentLinks(html: string, locale: Locale = "en"): string {
  const productPrefix = buildProductHref("", locale).slice(0, -1);

  return html
    .replace(/href="\/product\/([^"/]+)\/?"/gi, `href="${productPrefix}/$1"`)
    .replace(
      /href="https?:\/\/(?:www\.)?motorock\.eu\/product\/([^"/]+)\/?"/gi,
      `href="${productPrefix}/$1"`,
    )
    .replace(/href="\/toode\/([^"/]+)\/?"/gi, `href="${productPrefix}/$1"`)
    .replace(
      /href="https?:\/\/(?:www\.)?motorock\.eu\/toode\/([^"/]+)\/?"/gi,
      `href="${productPrefix}/$1"`,
    );
}

export function pickFirstImageFromHtml(html: string | null | undefined) {
  if (!html) {
    return null;
  }

  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ?? null;
}
