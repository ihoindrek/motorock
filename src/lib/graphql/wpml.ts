import { isLocale, type Locale } from "@/i18n/config";

export type GraphQLTranslation = {
  slug?: string | null;
  language?: {
    code?: string | null;
  } | null;
};

export type GraphQLLanguageAware = {
  languageCode?: string | null;
  translations?: GraphQLTranslation[] | null;
};

export function getGraphqlLanguageCode(node: GraphQLLanguageAware) {
  return node.languageCode?.toLowerCase() ?? null;
}

export function filterGraphqlNodesByLocale<T extends GraphQLLanguageAware>(
  nodes: readonly T[],
  locale: Locale,
): T[] {
  return nodes.filter((node) => getGraphqlLanguageCode(node) === locale);
}

export function findTranslationSlug(
  node: GraphQLLanguageAware,
  locale: Locale,
): string | null {
  const match = node.translations?.find(
    (translation) => translation.language?.code?.toLowerCase() === locale,
  );

  return match?.slug ?? null;
}

export function resolveProductSlugForLocale(
  node: GraphQLLanguageAware & { slug: string },
  locale: Locale,
) {
  if (getGraphqlLanguageCode(node) === locale) {
    return node.slug;
  }

  return findTranslationSlug(node, locale);
}

export function buildProductSlugAlternates(
  node: GraphQLLanguageAware & { slug: string },
): Partial<Record<Locale, string>> {
  const alternates: Partial<Record<Locale, string>> = {};
  const currentLocale = getGraphqlLanguageCode(node);

  if (isLocale(currentLocale)) {
    alternates[currentLocale] = node.slug;
  }

  for (const translation of node.translations ?? []) {
    const locale = translation.language?.code?.toLowerCase();

    if (isLocale(locale) && translation.slug) {
      alternates[locale] = translation.slug;
    }
  }

  return alternates;
}
