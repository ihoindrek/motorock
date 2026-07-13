import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const SHOP_MEDIA_PREFIX = `${DEFAULT_WOO_STORE_URL}/wp-content/`;

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

export function normalizeWordPressMediaUrlOptional(
  url: string | null | undefined,
): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  return normalizeWordPressMediaUrl(url);
}

export function normalizeWordPressMediaUrls(
  urls: readonly (string | null | undefined)[],
): string[] {
  return urls
    .map((url) => normalizeWordPressMediaUrlOptional(url))
    .filter((url): url is string => Boolean(url));
}
