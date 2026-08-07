import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { normalizeUrlPath } from "@/lib/seo/normalize-url-path";
import { getStorefrontUrl } from "@/lib/storefront/url";
import { isSiteIndexable } from "@/lib/site-indexing";

export type SlugAlternates = Partial<Record<Locale, string>>;

export type PageMetadataInput = {
  locale: Locale;
  title: string;
  description?: string;
  /** Path without locale prefix, e.g. `/shop/motorcycles` or `/`. */
  pathname: string;
  /** Per-locale slugs when path differs, e.g. product or blog post. */
  slugAlternates?: SlugAlternates;
  /** Path template with `{slug}`, e.g. `/product/{slug}` or per-locale map. */
  slugPathTemplate?: string | Partial<Record<Locale, string>>;
  noIndex?: boolean;
};

const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  et: "et_EE",
};

export const SITE_NAME = "Motorock.eu";

/** Fallback share image for pages without their own (home, categories, static). */
export const DEFAULT_OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

function absoluteUrl(path: string) {
  const base = getStorefrontUrl();
  const normalized = normalizeUrlPath(path.startsWith("/") ? path : `/${path}`);
  return `${base}${normalized}`;
}

function resolveSlugPathTemplate(
  locale: Locale,
  slugPathTemplate?: string | Partial<Record<Locale, string>>,
) {
  if (!slugPathTemplate) {
    return undefined;
  }

  return typeof slugPathTemplate === "string"
    ? slugPathTemplate
    : slugPathTemplate[locale];
}

export function resolveLocalizedPath(
  locale: Locale,
  pathname: string,
  slugAlternates?: SlugAlternates,
  slugPathTemplate?: string | Partial<Record<Locale, string>>,
) {
  const template = resolveSlugPathTemplate(locale, slugPathTemplate);

  if (template && slugAlternates) {
    const slug = slugAlternates[locale];
    if (slug) {
      return localizedHref(
        locale,
        template.replace("{slug}", slug),
      );
    }
  }

  return localizedHref(locale, pathname);
}

export function buildLanguageAlternates(
  pathname: string,
  slugAlternates?: SlugAlternates,
  slugPathTemplate?: string | Partial<Record<Locale, string>>,
) {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const template = resolveSlugPathTemplate(locale, slugPathTemplate);

    languages[locale] = absoluteUrl(
      template && slugAlternates?.[locale]
        ? localizedHref(
            locale,
            template.replace("{slug}", slugAlternates[locale] as string),
          )
        : localizedHref(locale, pathname),
    );
  }

  languages["x-default"] = languages.en;

  return languages;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const {
    locale,
    title,
    description,
    pathname,
    slugAlternates,
    slugPathTemplate,
    noIndex,
  } = input;

  const canonicalPath = resolveLocalizedPath(
    locale,
    pathname,
    slugAlternates,
    slugPathTemplate,
  );
  const languages = buildLanguageAlternates(
    pathname,
    slugAlternates,
    slugPathTemplate,
  );
  const alternateOpenGraphLocales = locales
    .filter((code) => code !== locale)
    .map((code) => OPEN_GRAPH_LOCALE[code]);

  const canonicalUrl = absoluteUrl(canonicalPath);

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE[locale],
      alternateLocale: alternateOpenGraphLocales,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };

  if (noIndex || !isSiteIndexable()) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}
