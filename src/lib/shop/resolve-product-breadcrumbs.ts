import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { EquipmentCategoryIndex, WcCategoryEntry } from "@/lib/graphql/categories";
import { getLocalizedCategoryName } from "@/lib/graphql/categories";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { getBrandBySlug } from "@/lib/shop/brands";
import type { Breadcrumb } from "@/lib/shop/category";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildEquipmentCategoryHrefFromNodes } from "@/lib/shop/equipment-route";
import { buildToolsCategoryHref } from "@/lib/shop/shop-category-route";
import { canonicalizeWcCategorySlugs } from "@/lib/shop/wc-categories";
import type { CatalogProduct } from "@/types/catalog-product";

function buildChainToRoot(
  index: EquipmentCategoryIndex,
  slug: string,
): WcCategoryEntry[] | null {
  const node = index.nodes.get(slug);

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
    const chain = buildChainToRoot(index, slug);

    if (!chain) {
      continue;
    }

    if (!best || chain.length > best.length) {
      best = chain;
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
