import type { Locale } from "@/i18n/config";
import { buildProductHref } from "@/lib/shop/product-url";
import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const SHOP_MEDIA_PREFIX = `${DEFAULT_WOO_STORE_URL}/wp-content/`;
const LEGACY_MEDIA_PREFIX =
  /https?:\/\/(?:www\.)?motorock\.eu\/wp-content\//gi;

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

export function normalizeWordPressMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("/wp-content/")) {
    return `${DEFAULT_WOO_STORE_URL}${trimmed}`;
  }

  return trimmed.replace(
    /^https?:\/\/(?:www\.)?motorock\.eu\/wp-content\//i,
    SHOP_MEDIA_PREFIX,
  );
}

export function rewriteBlogMediaUrls(html: string): string {
  return html
    .replace(LEGACY_MEDIA_PREFIX, SHOP_MEDIA_PREFIX)
    .replace(
      /(["'(])\/wp-content\//g,
      `$1${SHOP_MEDIA_PREFIX}`,
    );
}

export function rewriteBlogContentLinks(html: string, locale: Locale = "en"): string {
  const productPrefix = buildProductHref("", locale).slice(0, -1);

  return rewriteBlogMediaUrls(html)
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
  return match?.[1] ? normalizeWordPressMediaUrl(match[1]) : null;
}
