import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import {
  EQUIPMENT_ROOT_SLUGS,
  fetchEquipmentCategoryIndex,
  getLocalizedCategoryName,
  type WcCategoryEntry,
} from "@/lib/graphql/categories";
import { fetchBlogPostsPage } from "@/lib/graphql/blog-posts";
import { graphqlRequest } from "@/lib/graphql/client";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { buildEquipmentCategoryHrefFromNodes } from "@/lib/shop/equipment-route";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { localizedProductHref } from "@/lib/shop/product-url";

export type SiteLink = {
  type: "product" | "category" | "post";
  title: string;
  slug: string;
  url: string;
};

const PRODUCTS_QUERY = `
  query SiteLinkInventoryProducts($first: Int!) {
    products(
      first: $first
      where: { status: "publish", orderby: { field: DATE, order: DESC } }
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
        }
      }
    }
  }
`;

type ProductNode = {
  name?: string;
  slug?: string;
  languageCode?: string;
  translations?: {
    slug?: string;
    name?: string;
    language?: { code?: string };
  }[];
};

async function fetchProductLinks(locale: Locale, limit: number): Promise<SiteLink[]> {
  try {
    const data = await graphqlRequest<
      { products?: { nodes?: ProductNode[] } },
      { first: number }
    >(PRODUCTS_QUERY, { first: limit }, { next: { revalidate: 300 } });

    const links: SiteLink[] = [];

    for (const node of data.products?.nodes ?? []) {
      let name = node.name;
      let slug = node.slug;

      const nodeLocale = node.languageCode?.toLowerCase();
      if (nodeLocale && nodeLocale !== locale) {
        const translation = node.translations?.find(
          (entry) => entry.language?.code?.toLowerCase() === locale,
        );
        name = translation?.name ?? name;
        slug = translation?.slug ?? slug;
      }

      if (name && slug) {
        links.push({
          type: "product",
          title: name,
          slug,
          url: localizedProductHref(slug, locale),
        });
      }
    }

    return links;
  } catch {
    return [];
  }
}

async function fetchCategoryLinks(locale: Locale): Promise<SiteLink[]> {
  const index = await fetchEquipmentCategoryIndex(locale);
  if (!index) {
    return [];
  }

  const links: SiteLink[] = [];

  const walk = (node: WcCategoryEntry, chain: WcCategoryEntry[]) => {
    const fullChain = [...chain, node];

    links.push({
      type: "category",
      title: getLocalizedCategoryName(node, locale),
      slug: node.slug,
      url: localizedHref(locale, buildEquipmentCategoryHrefFromNodes(fullChain, locale)),
    });

    for (const child of index.nodes.values()) {
      if (child.parentSlug === node.slug) {
        walk(child, fullChain);
      }
    }
  };

  for (const rootSlug of EQUIPMENT_ROOT_SLUGS) {
    const root = index.nodes.get(rootSlug);
    if (root) {
      walk(root, []);
    }
  }

  return links;
}

async function fetchPostLinks(locale: Locale, limit: number): Promise<SiteLink[]> {
  try {
    const page = await fetchBlogPostsPage({ first: limit, locale });

    return page.posts.map((post) => ({
      type: "post" as const,
      title: post.title,
      slug: post.slug,
      url: localizedHref(locale, `/blog/${post.slug}`),
    }));
  } catch {
    return [];
  }
}

function staticHubLinks(locale: Locale): SiteLink[] {
  return [
    {
      type: "category",
      title: "Equipment hub",
      slug: "equipment",
      url: localizedHref(locale, buildEquipmentHubHref(locale)),
    },
    {
      type: "category",
      title: "Motorcycles",
      slug: "motorcycles",
      url: localizedHref(locale, "/shop/motorcycles"),
    },
    {
      type: "category",
      title: "Tools",
      slug: "tools",
      url: localizedHref(locale, locale === "et" ? "/shop/tooriistad-ja-hooldus" : "/shop/tools"),
    },
    {
      type: "post",
      title: "Journal",
      slug: "blog",
      url: localizedHref(locale, "/blog"),
    },
    {
      type: "category",
      title: "Contact",
      slug: "contact",
      url: localizedHref(locale, "/contact"),
    },
  ];
}

/** Real site URLs (products, categories, posts) that AI link suggestions must come from. */
export async function fetchSiteLinkInventory(
  locale: Locale,
  options?: { productLimit?: number; postLimit?: number },
): Promise<SiteLink[]> {
  const [products, categories, posts] = await Promise.all([
    fetchProductLinks(locale, options?.productLimit ?? 100),
    fetchCategoryLinks(locale),
    fetchPostLinks(locale, options?.postLimit ?? 30),
  ]);

  const brandLinks: SiteLink[] = [
    "brixton",
    "holyfreedom",
    "bobhead",
    "johnnyreb",
    "makita",
    "mutt",
    "motogirl",
  ].map((slug) => ({
    type: "category" as const,
    title: slug,
    slug,
    url: localizedHref(locale, buildBrandCatalogHref(locale, slug)),
  }));

  return [...staticHubLinks(locale), ...brandLinks, ...categories, ...products, ...posts];
}

export function formatLinkInventoryForPrompt(links: SiteLink[]) {
  if (links.length === 0) {
    return "None";
  }

  return links
    .map((link) => `- [${link.type}] ${link.title} | ${link.url}`)
    .join("\n");
}
