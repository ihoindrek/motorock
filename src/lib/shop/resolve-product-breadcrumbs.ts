import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { EquipmentCategoryIndex, WcCategoryEntry } from "@/lib/graphql/categories";
import {
  categoryNodeKey,
  getLocalizedCategoryName,
} from "@/lib/graphql/categories";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { getBrandBySlug } from "@/lib/shop/brands";
import type { Breadcrumb } from "@/lib/shop/category";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildEquipmentCategoryHrefFromNodes } from "@/lib/shop/equipment-route";
import { buildToolsCategoryHref } from "@/lib/shop/shop-category-route";
import { canonicalizeWcCategorySlugs } from "@/lib/shop/wc-categories";
import type { CatalogProduct } from "@/types/catalog-product";

function findCategoryNode(
  index: EquipmentCategoryIndex,
  slug: string,
  parentHint?: string,
): WcCategoryEntry | null {
  if (parentHint) {
    const hinted = index.nodes.get(categoryNodeKey(slug, parentHint));

    if (hinted) {
      return hinted;
    }
  }

  const matches = [...index.nodes.values()].filter((node) => node.slug === slug);

  if (matches.length === 1) {
    return matches[0] ?? null;
  }

  if (parentHint) {
    return matches.find((node) => node.parentSlug === parentHint) ?? null;
  }

  return index.nodes.get(slug) ?? null;
}

function buildChainToRoot(
  index: EquipmentCategoryIndex,
  slug: string,
  parentHint?: string,
): WcCategoryEntry[] | null {
  const node = findCategoryNode(index, slug, parentHint);

  if (!node) {
    return null;
  }

  const chain: WcCategoryEntry[] = [node];
  let current = node;

  while (current.parentSlug) {
    const parent = index.nodes.get(current.parentSlug);

    if (!parent) {
      break;
    }

    chain.unshift(parent);
    current = parent;
  }

  const root = chain[0];

  if (!root || !index.roots.includes(root.slug)) {
    return null;
  }

  return chain;
}

function findDeepestEquipmentCategoryChain(
  wcCategorySlugs: readonly string[] | undefined,
  index: EquipmentCategoryIndex | null,
): WcCategoryEntry[] | null {
  if (!index || !wcCategorySlugs?.length) {
    return null;
  }

  const slugs = canonicalizeWcCategorySlugs(wcCategorySlugs);
  let best: WcCategoryEntry[] | null = null;

  for (const slug of slugs) {
    const parentHints = slugs.filter((candidate) => candidate !== slug);

    for (const parentHint of [undefined, ...parentHints]) {
      const chain = buildChainToRoot(index, slug, parentHint);

      if (!chain) {
        continue;
      }

      if (!best || chain.length > best.length) {
        best = chain;
      }

      break;
    }
  }

  return best;
}

export function resolveProductBreadcrumbs(
  product: Pick<
    CatalogProduct,
    "type" | "category" | "wcCategorySlugs" | "backHref" | "backLabel" | "brand"
  >,
  locale: Locale,
  dict: Dictionary,
  categoryIndex: EquipmentCategoryIndex | null,
): Breadcrumb[] {
  const home: Breadcrumb = {
    label: dict.pdp.breadcrumbHome,
    href: "/",
  };

  if (product.type === "motorcycle") {
    const crumbs: Breadcrumb[] = [
      home,
      {
        label: product.backLabel,
        href: product.backHref,
      },
    ];

    const brand = getBrandBySlug(product.brand);

    if (brand) {
      crumbs.push({
        label: brand.name,
        href: buildBrandCatalogHref(locale, brand.slug),
      });
    }

    return crumbs;
  }

  if (product.category === "tools") {
    return [
      home,
      {
        label: product.backLabel,
        href: buildToolsCategoryHref(locale),
      },
    ];
  }

  const chain = findDeepestEquipmentCategoryChain(
    product.wcCategorySlugs,
    categoryIndex,
  );

  if (!chain?.length) {
    return [
      home,
      {
        label: product.backLabel,
        href: product.backHref || buildEquipmentHubHref(locale),
      },
    ];
  }

  return [
    home,
    {
      label: dict.nav.equipment,
      href: buildEquipmentHubHref(locale),
    },
    ...chain.map((node, index) => ({
      label: getLocalizedCategoryName(node, locale),
      href: buildEquipmentCategoryHrefFromNodes(chain.slice(0, index + 1), locale),
    })),
  ];
}
