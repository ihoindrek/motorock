import type { Locale } from "@/i18n/config";
import { localizedProductHref } from "@/lib/shop/product-url";
import { graphqlRequest } from "@/lib/graphql/client";

/** Compact product facts passed to the blog prompt so the AI links real products. */
export type BlogProductSuggestion = {
  name: string;
  url: string;
  price: string;
  imageUrl?: string;
  inStock: boolean;
};

const BLOG_PRODUCT_SUGGESTIONS_QUERY = `
  query BlogProductSuggestions($first: Int!, $category: String) {
    products(
      first: $first
      where: { status: "publish", category: $category, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
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
        }
        ... on VariableProduct {
          price
          stockStatus
        }
      }
    }
  }
`;

type SuggestionNode = {
  name?: string;
  slug?: string;
  languageCode?: string;
  translations?: {
    slug?: string;
    name?: string;
    language?: { code?: string };
  }[];
  image?: { sourceUrl?: string } | null;
  price?: string | null;
  stockStatus?: string | null;
};

type SuggestionsResponse = {
  products?: { nodes?: SuggestionNode[] };
};

function localizedNameAndSlug(node: SuggestionNode, locale: Locale) {
  const nodeLocale = node.languageCode?.toLowerCase();
  if (!nodeLocale || nodeLocale === locale) {
    return { name: node.name, slug: node.slug };
  }

  const translation = node.translations?.find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  return {
    name: translation?.name ?? node.name,
    slug: translation?.slug ?? node.slug,
  };
}

export async function fetchBlogProductSuggestions(input: {
  locale: Locale;
  categorySlug: string;
  limit?: number;
}): Promise<BlogProductSuggestion[]> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);

  let data: SuggestionsResponse;
  try {
    data = await graphqlRequest<SuggestionsResponse, { first: number; category: string }>(
      BLOG_PRODUCT_SUGGESTIONS_QUERY,
      { first: limit * 2, category: input.categorySlug },
      { next: { revalidate: 0 } },
    );
  } catch {
    return [];
  }

  const nodes = data.products?.nodes ?? [];
  const suggestions: BlogProductSuggestion[] = [];

  for (const node of nodes) {
    const { name, slug } = localizedNameAndSlug(node, input.locale);
    if (!name || !slug) {
      continue;
    }

    suggestions.push({
      name,
      url: localizedProductHref(slug, input.locale),
      price: node.price ?? "",
      imageUrl: node.image?.sourceUrl ?? undefined,
      inStock: node.stockStatus !== "OUT_OF_STOCK",
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
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
        `URL: ${product.url}`,
        product.price ? `Price: ${product.price}` : null,
        product.imageUrl ? `Image: ${product.imageUrl}` : null,
        product.inStock ? "In stock" : "Out of stock",
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    })
    .join("\n");
}
