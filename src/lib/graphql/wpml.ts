import { isLocale, type Locale } from "@/i18n/config";

export type GraphQLTranslation = {
  databaseId?: number | null;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  language?: {
    code?: string | null;
  } | null;
};

export type GraphQLLanguageAware = {
  slug?: string;
  name?: string;
  languageCode?: string | null;
  translations?: GraphQLTranslation[] | null;
};

export function getGraphqlLanguageCode(node: GraphQLLanguageAware) {
  return node.languageCode?.toLowerCase() ?? null;
}

/** Catalog list queries return default-language (EN) nodes; keep them for ET locale. */
export function selectCatalogNodesForLocale<T extends GraphQLLanguageAware>(
  nodes: readonly T[],
  locale: Locale,
): T[] {
  if (locale === "en") {
    return nodes.filter((node) => {
      const language = getGraphqlLanguageCode(node);
      return !language || language === "en";
    });
  }

  const etSlugsInBatch = new Set(
    nodes
      .filter((node) => getGraphqlLanguageCode(node) === "et" && node.slug)
      .map((node) => node.slug as string),
  );

  return nodes.filter((node) => {
    const language = getGraphqlLanguageCode(node);

    if (language === "et") {
      return true;
    }

    if (language === "en") {
      const etSlug = findTranslationSlug(node, "et");
      if (etSlug && etSlugsInBatch.has(etSlug)) {
        return false;
      }

      return true;
    }

    return false;
  });
}

export function resolveLocalizedProductFields(
  node: GraphQLLanguageAware & { slug: string; name: string },
  locale: Locale,
): { slug: string; name: string } {
  const language = getGraphqlLanguageCode(node);

  if (language === locale) {
    return { slug: node.slug, name: node.name };
  }

  const translation = node.translations?.find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  if (translation?.slug) {
    return {
      slug: translation.slug,
      name: translation.name ?? node.name,
    };
  }

  return { slug: node.slug, name: node.name };
}

/** @deprecated Use selectCatalogNodesForLocale for product lists. */
export function filterGraphqlNodesByLocale<T extends GraphQLLanguageAware>(
  nodes: readonly T[],
  locale: Locale,
): T[] {
  return selectCatalogNodesForLocale(nodes, locale);
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

export function findTranslationDatabaseId(
  node: GraphQLLanguageAware,
  locale: Locale,
): number | null {
  const match = node.translations?.find(
    (translation) => translation.language?.code?.toLowerCase() === locale,
  );

  return match?.databaseId ?? null;
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

export function resolveLocalizedPostFields(
  node: GraphQLLanguageAware & { slug: string; title: string },
  locale: Locale,
): { slug: string; title: string } {
  const language = getGraphqlLanguageCode(node);

  if (language === locale) {
    return { slug: node.slug, title: node.title };
  }

  const translation = node.translations?.find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  if (translation?.slug) {
    return {
      slug: translation.slug,
      title: translation.title ?? node.title,
    };
  }

  return { slug: node.slug, title: node.title };
}

export function resolvePostSlugForLocale(
  node: GraphQLLanguageAware & { slug: string; title?: string },
  locale: Locale,
) {
  return resolveLocalizedPostFields(
    { ...node, title: node.title ?? node.name ?? node.slug },
    locale,
  ).slug;
}

export function buildPostSlugAlternates(
  node: GraphQLLanguageAware & { slug: string },
): Partial<Record<Locale, string>> {
  return buildProductSlugAlternates(node);
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
