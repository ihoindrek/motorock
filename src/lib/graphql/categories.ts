import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  EQUIPMENT_CATEGORY_INDEX,
  PRODUCT_CATEGORY_NAV_TREE,
} from "@/lib/graphql/category-queries";
import type { GraphQLTranslation } from "@/lib/graphql/wpml";

export type WcCategoryNode = {
  slug: string;
  name: string;
  count?: number | null;
  languageCode?: string | null;
  translations?: GraphQLTranslation[] | null;
  children?: {
    nodes: WcCategoryNode[];
  } | null;
};

export type WcCategoryEntry = WcCategoryNode & {
  parentSlug: string | null;
};

export type EquipmentNavTree = {
  forMen: WcCategoryNode | null;
  forWomen: WcCategoryNode | null;
  accessories: WcCategoryNode | null;
  helmets: WcCategoryNode | null;
};

export type EquipmentCategoryIndex = {
  nodes: ReadonlyMap<string, WcCategoryEntry>;
  roots: readonly string[];
};

export const EQUIPMENT_ROOT_SLUGS = [
  "for-men",
  "for-women",
  "accessories",
  "helmets",
] as const;

const EXCLUDED_ROOT_SLUGS = new Set([
  "motorcycles",
  "other",
  "uncategorized",
  "tools-maintenance",
]);

type ProductCategoryNavTreeResponse = {
  forMen: { nodes: WcCategoryNode[] };
  forWomen: { nodes: WcCategoryNode[] };
  accessories: { nodes: WcCategoryNode[] };
  helmets: { nodes: WcCategoryNode[] };
};

type EquipmentCategoryIndexResponse = {
  productCategories: {
    nodes: Array<
      WcCategoryNode & {
        parent?: {
          node?: {
            slug?: string | null;
          } | null;
        } | null;
      }
    >;
  };
};

export function getLocalizedCategoryName(
  node: Pick<WcCategoryNode, "name" | "languageCode" | "translations">,
  locale: Locale,
): string {
  const language = node.languageCode?.toLowerCase();

  if (language === locale) {
    return node.name;
  }

  const translation = node.translations?.find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  return translation?.name ?? node.name;
}

function buildIndex(
  nodes: EquipmentCategoryIndexResponse["productCategories"]["nodes"],
): EquipmentCategoryIndex {
  const entries = new Map<string, WcCategoryEntry>();

  for (const node of nodes) {
    if (EXCLUDED_ROOT_SLUGS.has(node.slug)) {
      continue;
    }

    entries.set(node.slug, {
      slug: node.slug,
      name: node.name,
      count: node.count,
      languageCode: node.languageCode,
      translations: node.translations,
      parentSlug: node.parent?.node?.slug ?? null,
    });
  }

  const roots = EQUIPMENT_ROOT_SLUGS.filter((slug) => entries.has(slug));

  return { nodes: entries, roots };
}

export function navTreeFromIndex(index: EquipmentCategoryIndex): EquipmentNavTree {
  const withChildren = (slug: string): WcCategoryNode | null => {
    const root = index.nodes.get(slug);

    if (!root) {
      return null;
    }

    const children = [...index.nodes.values()]
      .filter((node) => node.parentSlug === slug)
      .sort((left, right) => {
        const leftCount = left.count ?? 0;
        const rightCount = right.count ?? 0;

        if (rightCount !== leftCount) {
          return rightCount - leftCount;
        }

        return left.name.localeCompare(right.name);
      });

    return {
      ...root,
      children: { nodes: children },
    };
  };

  return {
    forMen: withChildren("for-men"),
    forWomen: withChildren("for-women"),
    accessories: withChildren("accessories"),
    helmets: withChildren("helmets"),
  };
}

export function resolveCategoryPath(
  index: EquipmentCategoryIndex,
  slugSegments: readonly string[],
): WcCategoryEntry[] | null {
  if (slugSegments.length === 0) {
    return [];
  }

  const chain: WcCategoryEntry[] = [];

  for (let indexOffset = 0; indexOffset < slugSegments.length; indexOffset += 1) {
    const segment = slugSegments[indexOffset];
    const node = index.nodes.get(segment);

    if (!node) {
      return null;
    }

    if (indexOffset === 0) {
      if (!index.roots.includes(segment)) {
        return null;
      }
    } else if (node.parentSlug !== slugSegments[indexOffset - 1]) {
      return null;
    }

    chain.push(node);
  }

  return chain;
}

export const fetchEquipmentCategoryIndex = cache(
  async (_locale: Locale): Promise<EquipmentCategoryIndex | null> => {
    try {
      const data = await graphqlRequest<EquipmentCategoryIndexResponse>(
        EQUIPMENT_CATEGORY_INDEX,
      );

      return buildIndex(data.productCategories.nodes);
    } catch (error) {
      console.error("[categories] GraphQL category index fetch failed:", error);
      return null;
    }
  },
);

export const fetchProductCategoryTree = cache(
  async (locale: Locale): Promise<EquipmentNavTree | null> => {
    const index = await fetchEquipmentCategoryIndex(locale);

    if (index) {
      return navTreeFromIndex(index);
    }

    try {
      const data = await graphqlRequest<ProductCategoryNavTreeResponse>(
        PRODUCT_CATEGORY_NAV_TREE,
      );

      return {
        forMen: data.forMen.nodes[0] ?? null,
        forWomen: data.forWomen.nodes[0] ?? null,
        accessories: data.accessories.nodes[0] ?? null,
        helmets: data.helmets.nodes[0] ?? null,
      };
    } catch (error) {
      console.error("[categories] GraphQL category tree fetch failed:", error);
      return null;
    }
  },
);
