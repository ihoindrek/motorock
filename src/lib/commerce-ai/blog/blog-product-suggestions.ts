import type { Locale } from "@/i18n/config";
import type { GraphQLProductAttribute } from "@/lib/graphql/types";
import { listGraphqlTranslations } from "@/lib/graphql/wpml";
import { localizedProductHref } from "@/lib/shop/product-url";
import { graphqlRequest } from "@/lib/graphql/client";

/** Compact product facts passed to the blog prompt so the AI links real products. */
export type BlogProductSuggestion = {
  name: string;
  slug: string;
  url: string;
  price: string;
  imageUrl?: string;
  inStock: boolean;
};

const SUGGESTION_NODE_FIELDS = `
  ... on Product {
    name
    slug
    languageCode
    translations {
      slug
      name
      language {
        code
      }
    }
    image {
      sourceUrl
    }
  }
  ... on SimpleProduct {
    price
    stockStatus
    attributes {
      nodes {
        name
        options
        ... on GlobalProductAttribute {
          terms(first: 20) {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  }
  ... on VariableProduct {
    price
    stockStatus
    attributes {
      nodes {
        name
        options
        ... on GlobalProductAttribute {
          terms(first: 20) {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  }
`;

const CATEGORY_SUGGESTIONS_QUERY = `
  query BlogProductSuggestionsByCategory($first: Int!, $category: String) {
    products(
      first: $first
      where: { status: "publish", category: $category, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
        ${SUGGESTION_NODE_FIELDS}
      }
    }
  }
`;

const BRAND_SUGGESTIONS_QUERY = `
  query BlogProductSuggestionsByBrand($first: Int!, $brandTerms: [String]!) {
    products(
      first: $first
      where: {
        status: "publish"
        orderby: { field: DATE, order: DESC }
        taxonomyFilter: {
          filters: [{ taxonomy: PA_BRAND, operator: IN, terms: $brandTerms }]
        }
      }
    ) {
      nodes {
        ${SUGGESTION_NODE_FIELDS}
      }
    }
  }
`;

type SuggestionNode = {
  name?: string;
  slug?: string;
  languageCode?: string;
  translations?: Array<{
    slug?: string;
    name?: string;
    language?: { code?: string } | null;
  } | null> | null;
  image?: { sourceUrl?: string } | null;
  price?: string | null;
  stockStatus?: string | null;
  attributes?: { nodes: GraphQLProductAttribute[] } | null;
};

export type CategoryProductContext = {
  suggestions: BlogProductSuggestion[];
  brandProducts: ReadonlyArray<{ attributes?: { nodes: GraphQLProductAttribute[] } | null }>;
};

type SuggestionsResponse = {
  products?: { nodes?: SuggestionNode[] };
};

const COMMERCE_AI_GRAPHQL_OPTS = {
  next: { revalidate: 0 as const },
  retryAttempts: 1,
  timeoutMs: 12_000,
};

function localizedNameAndSlug(node: SuggestionNode, locale: Locale) {
  const nodeLocale = node.languageCode?.toLowerCase();
  if (!nodeLocale || nodeLocale === locale) {
    return { name: node.name, slug: node.slug };
  }

  const translation = listGraphqlTranslations(node.translations).find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  return {
    name: translation?.name ?? node.name,
    slug: translation?.slug ?? node.slug,
  };
}

function mapSuggestionNodes(
  nodes: SuggestionNode[],
  locale: Locale,
  limit: number,
): CategoryProductContext {
  const suggestions: BlogProductSuggestion[] = [];
  const brandProducts: SuggestionNode[] = [];

  for (const node of nodes) {
    brandProducts.push(node);

    const { name, slug } = localizedNameAndSlug(node, locale);
    if (!name || !slug) {
      continue;
    }

    suggestions.push({
      name,
      slug,
      url: localizedProductHref(slug, locale),
      price: node.price ?? "",
      imageUrl: node.image?.sourceUrl ?? undefined,
      inStock: node.stockStatus !== "OUT_OF_STOCK",
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return { suggestions, brandProducts };
}

async function fetchSuggestionNodes(input: {
  categorySlug?: string;
  brandSlug?: string;
  limit: number;
}): Promise<SuggestionNode[]> {
  const limit = Math.min(Math.max(input.limit, 1), 12);

  try {
    if (input.brandSlug) {
      const data = await graphqlRequest<
        SuggestionsResponse,
        { first: number; brandTerms: string[] }
      >(
        BRAND_SUGGESTIONS_QUERY,
        { first: limit * 2, brandTerms: [input.brandSlug] },
        COMMERCE_AI_GRAPHQL_OPTS,
      );
      return data.products?.nodes ?? [];
    }

    if (input.categorySlug) {
      const data = await graphqlRequest<
        SuggestionsResponse,
        { first: number; category: string }
      >(
        CATEGORY_SUGGESTIONS_QUERY,
        { first: limit * 2, category: input.categorySlug },
        COMMERCE_AI_GRAPHQL_OPTS,
      );
      return data.products?.nodes ?? [];
    }
  } catch {
    return [];
  }

  return [];
}

export async function fetchCategoryProductContext(input: {
  locale: Locale;
  categorySlug: string;
  limit?: number;
}): Promise<CategoryProductContext> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const nodes = await fetchSuggestionNodes({
    categorySlug: input.categorySlug,
    limit,
  });

  return mapSuggestionNodes(nodes, input.locale, limit);
}

export async function fetchBlogProductSuggestions(input: {
  locale: Locale;
  categorySlug?: string;
  brandSlug?: string;
  limit?: number;
}): Promise<BlogProductSuggestion[]> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const nodes = await fetchSuggestionNodes({
    categorySlug: input.categorySlug,
    brandSlug: input.brandSlug,
    limit,
  });

  return mapSuggestionNodes(nodes, input.locale, limit).suggestions;
}

/** Render suggestions as plain text lines for the prompt. */
export function formatProductSuggestionsForPrompt(
  suggestions: BlogProductSuggestion[],
) {
  if (suggestions.length === 0) {
    return "None";
  }

  return suggestions
    .map((product) => {
      const parts = [
        `Name: ${product.name}`,
        `Slug: ${product.slug}`,
        `URL: ${product.url}`,
        product.price ? `Price: ${product.price}` : null,
        product.inStock ? "In stock" : "Out of stock",
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}
