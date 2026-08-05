import type { Locale } from "@/i18n/config";
import { graphqlRequest } from "@/lib/graphql/client";
import type { GraphQLProduct } from "@/lib/graphql/types";
import type { GraphQLBlogPostCard } from "@/lib/graphql/types-blog";
import {
  getGraphqlLanguageCode,
  selectCatalogNodesForLocale,
} from "@/lib/graphql/wpml";
import {
  SEO_AUDIT_POSTS_PAGE,
  SEO_AUDIT_PRODUCTS_PAGE,
} from "@/lib/commerce-ai/seo/audit-queries";
import { MAX_SEO_AUDIT_LIMIT } from "@/lib/commerce-ai/seo/audit-types";

type AuditProductsResponse = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: GraphQLProduct[];
  };
};

type AuditPostsResponse = {
  contentNodes: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: GraphQLBlogPostCard[];
  };
};

function matchesProductCategory(product: GraphQLProduct, categorySlug?: string) {
  if (!categorySlug) {
    return true;
  }

  const slugs = (product.productCategories?.nodes ?? []).map((node) => node.slug);

  if (categorySlug === "motorcycles") {
    return (product.productCategories?.nodes ?? []).some(
      (category) =>
        category.slug === "motorcycles" ||
        category.parent?.node?.slug === "motorcycles",
    );
  }

  return slugs.includes(categorySlug);
}

function selectPostsForLocale(nodes: GraphQLBlogPostCard[], locale: Locale) {
  if (locale === "en") {
    return nodes.filter((node) => {
      const language = getGraphqlLanguageCode(node);
      return !language || language === "en";
    });
  }

  return nodes.filter((node) => getGraphqlLanguageCode(node) === "et");
}

export async function fetchAuditProducts(input: {
  locale: Locale;
  category?: string;
  limit: number;
  offset?: number;
}) {
  const limit = Math.min(Math.max(input.limit, 1), MAX_SEO_AUDIT_LIMIT);
  const offset = Math.max(0, input.offset ?? 0);
  const targetCount = offset + limit;
  const collected: GraphQLProduct[] = [];
  let after: string | null = null;

  while (collected.length < targetCount) {
    const pageSize = Math.min(100, targetCount - collected.length);
    const data: AuditProductsResponse = await graphqlRequest<
      AuditProductsResponse,
      { first: number; after: string | null }
    >(SEO_AUDIT_PRODUCTS_PAGE, { first: pageSize, after }, { next: { revalidate: 0 } });

    const localized = selectCatalogNodesForLocale(data.products.nodes, input.locale).filter(
      (product) => matchesProductCategory(product, input.category),
    );

    collected.push(...localized);

    if (!data.products.pageInfo.hasNextPage || collected.length >= targetCount) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return collected.slice(offset, offset + limit);
}

export async function fetchAuditPosts(input: {
  locale: Locale;
  limit: number;
  offset?: number;
}) {
  const limit = Math.min(Math.max(input.limit, 1), MAX_SEO_AUDIT_LIMIT);
  const offset = Math.max(0, input.offset ?? 0);
  const targetCount = offset + limit;
  const collected: GraphQLBlogPostCard[] = [];
  let after: string | null = null;

  while (collected.length < targetCount) {
    const pageSize = Math.min(50, targetCount - collected.length);
    const data: AuditPostsResponse = await graphqlRequest<
      AuditPostsResponse,
      { first: number; after: string | null }
    >(SEO_AUDIT_POSTS_PAGE, { first: pageSize, after }, { next: { revalidate: 0 } });

    const localized = selectPostsForLocale(data.contentNodes.nodes, input.locale).filter(
      (post) => Boolean(post.slug && post.title),
    );

    collected.push(...localized);

    if (!data.contentNodes.pageInfo.hasNextPage || collected.length >= targetCount) {
      break;
    }

    after = data.contentNodes.pageInfo.endCursor;
  }

  return collected.slice(offset, offset + limit);
}
