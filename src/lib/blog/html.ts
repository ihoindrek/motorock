import type { Locale } from "@/i18n/config";
import { decodeHtmlEntities } from "@/lib/html/decode-html-entities";
import { buildProductHref } from "@/lib/shop/product-url";
import { normalizeWordPressMediaUrl } from "@/lib/shop/wordpress-media-url";
import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const SHOP_MEDIA_PREFIX = `${DEFAULT_WOO_STORE_URL}/wp-content/`;
const LEGACY_MEDIA_PREFIX =
  /https?:\/\/(?:www\.)?motorock\.eu\/wp-content\//gi;

/** WordPress excerpt / <!--more--> placeholders that should not appear as literal text. */
export function cleanWordPressEllipsisMarkers(text: string): string {
  return text
    .replace(/\s*\[&(?:hellip|#8230|#x2026);\]\s*/gi, " ")
    .replace(/\s*\[(?:\.{3}|…)\]\s*/g, " ")
    .replace(/<!--\s*more\s*-->/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same markers inside HTML content — do not collapse the whole document. */
export function cleanWordPressEllipsisInHtml(html: string): string {
  return html
    .replace(/\s*\[&(?:hellip|#8230|#x2026);\]\s*/gi, "")
    .replace(/\s*\[(?:\.{3}|…)\]\s*/g, "")
    .replace(/<!--\s*more\s*-->/gi, "");
}

export function stripHtml(html: string): string {
  return cleanWordPressEllipsisMarkers(
    decodeHtmlEntities(
      html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  );
}

export function decodeBasicHtmlEntities(text: string): string {
  return decodeHtmlEntities(text);
}

export function estimateReadTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export { normalizeWordPressMediaUrl } from "@/lib/shop/wordpress-media-url";

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

  return cleanWordPressEllipsisInHtml(
    rewriteBlogMediaUrls(html)
      .replace(/href="\/product\/([^"/]+)\/?"/gi, `href="${productPrefix}/$1"`)
      .replace(
        /href="https?:\/\/(?:www\.)?motorock\.eu\/product\/([^"/]+)\/?"/gi,
        `href="${productPrefix}/$1"`,
      )
      .replace(/href="\/toode\/([^"/]+)\/?"/gi, `href="${productPrefix}/$1"`)
      .replace(
        /href="https?:\/\/(?:www\.)?motorock\.eu\/toode\/([^"/]+)\/?"/gi,
        `href="${productPrefix}/$1"`,
      ),
  );
}

export function pickFirstImageFromHtml(html: string | null | undefined) {
  if (!html) {
    return null;
  }

  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ? normalizeWordPressMediaUrl(match[1]) : null;
}
