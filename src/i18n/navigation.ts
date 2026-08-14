import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import type { EquipmentNavTree, WcCategoryEntry, WcCategoryNode } from "@/lib/graphql/categories";
import { categoryHasProducts, getLocalizedCategoryName, getLocalizedCategorySlug } from "@/lib/graphql/categories";
import { getActiveCampaigns } from "@/lib/campaigns/evaluate";
import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";
import { HELMET_WC_SLUGS } from "@/lib/shop/wc-categories";
import {
  buildEquipmentCategoryHref,
  buildEquipmentHubHref,
} from "@/lib/shop/category-url";
import { buildEquipmentRootCategoryHref } from "@/lib/shop/equipment-route";
import {
  buildShopCategoryHref,
  buildToolsCategoryHref,
} from "@/lib/shop/shop-category-route";
import type { MegaMenu, NavColumn, NavColumnId, NavLink, PrimaryNavItem } from "@/data/navigation";
import type { Campaign } from "@/types/campaign";

const equipmentBrandSlugs = [
  { slug: "pando-moto", label: "Pando Moto" },
  { slug: "holyfreedom", label: "Holyfreedom" },
  { slug: "johnny-reb", label: "Johnny Reb" },
  { slug: "bobhead", label: "Bobhead" },
  { slug: "motogirl", label: "Motogirl" },
] as const;

function sortCategoryChildren(children: readonly WcCategoryNode[]) {
  return [...children].sort((left, right) => {
    const leftCount = left.count ?? 0;
    const rightCount = right.count ?? 0;

    if (rightCount !== leftCount) {
      return rightCount - leftCount;
    }

    return left.name.localeCompare(right.name);
  });
}

function buildCategoryColumnLinks(
  locale: Locale,
  parent: WcCategoryNode,
  children: readonly WcCategoryNode[],
): NavLink[] {
  const links: NavLink[] = [];

  for (const child of sortCategoryChildren(children).filter(categoryHasProducts)) {
    if (parent.slug === "accessories" && HELMET_WC_SLUGS.has(child.slug)) {
      continue;
    }

    links.push({
      href: localizedHref(
        locale,
        buildEquipmentCategoryHref(
          locale,
          getLocalizedCategorySlug(parent, locale),
          getLocalizedCategorySlug(child, locale),
        ),
      ),
      label: getLocalizedCategoryName(child, locale),
    });
  }

  return links;
}

export function buildEquipmentMegaMenuFromTree(
  locale: Locale,
  dict: Dictionary,
  tree: EquipmentNavTree,
): MegaMenu {
  const equipmentBrandLinks = equipmentBrandSlugs.map(({ slug, label }) => ({
    href: localizedHref(locale, getBrandCatalogHref(slug, locale)),
    label,
  }));

  const accessoriesLinks: NavLink[] = [];

  if (tree.accessories?.children?.nodes.length) {
    for (const link of buildCategoryColumnLinks(
      locale,
      tree.accessories,
      tree.accessories.children.nodes,
    )) {
      if (!accessoriesLinks.some((existing) => existing.href === link.href)) {
        accessoriesLinks.push(link);
      }
    }
  }

  const columns: NavColumn[] = [
    {
      id: "men",
      title: dict.nav.forMen,
      viewAll: {
        href: localizedHref(
          locale,
          buildEquipmentRootCategoryHref(tree.forMen, "for-men", locale),
        ),
        label: dict.nav.viewAllMens,
      },
      links: tree.forMen?.children?.nodes.length
        ? buildCategoryColumnLinks(locale, tree.forMen, tree.forMen.children.nodes)
        : [],
    },
    {
      id: "women",
      title: dict.nav.forWomen,
      viewAll: {
        href: localizedHref(
          locale,
          buildEquipmentRootCategoryHref(tree.forWomen, "for-women", locale),
        ),
        label: dict.nav.viewAllWomens,
      },
      links: tree.forWomen?.children?.nodes.length
        ? buildCategoryColumnLinks(locale, tree.forWomen, tree.forWomen.children.nodes)
        : [],
    },
    {
      id: "accessories",
      title: dict.nav.accessories,
      viewAll: {
        href: localizedHref(
          locale,
          buildEquipmentRootCategoryHref(tree.accessories, "accessories", locale),
        ),
        label: dict.nav.viewAllAccessories,
      },
      links: accessoriesLinks,
    },
    {
      id: "brands",
      title: dict.nav.brands,
      viewAll: {
        href: localizedHref(locale, buildEquipmentHubHref(locale)),
        label: dict.nav.shopAllEquipment,
      },
      links: equipmentBrandLinks,
    },
  ];

  return {
    columns,
    promo: {
      href: localizedHref(locale, getBrandCatalogHref("pando-moto", locale)),
      image: "/JRH10015_L23.webp",
      imageAlt: "Pando Moto riding gear",
      tag: dict.nav.promoTag,
      headline: dict.nav.promoHeadline,
      cta: dict.nav.shopEquipment,
    },
  };
}

function buildEmptyEquipmentMegaMenu(locale: Locale, dict: Dictionary): MegaMenu {
  const equipmentBrandLinks = equipmentBrandSlugs.map(({ slug, label }) => ({
    href: localizedHref(locale, getBrandCatalogHref(slug, locale)),
    label,
  }));

  const emptyColumn = (
    id: NavColumnId,
    title: string,
    viewAllHref: string,
    viewAllLabel: string,
  ): NavColumn => ({
    id,
    title,
    viewAll: {
      href: localizedHref(locale, viewAllHref),
      label: viewAllLabel,
    },
    links: [],
  });

  return {
    columns: [
      emptyColumn(
        "men",
        dict.nav.forMen,
        buildEquipmentCategoryHref(locale, "for-men"),
        dict.nav.viewAllMens,
      ),
      emptyColumn(
        "women",
        dict.nav.forWomen,
        buildEquipmentCategoryHref(locale, "for-women"),
        dict.nav.viewAllWomens,
      ),
      emptyColumn(
        "accessories",
        dict.nav.accessories,
        buildEquipmentCategoryHref(locale, "accessories"),
        dict.nav.viewAllAccessories,
      ),
      {
        id: "brands",
        title: dict.nav.brands,
        viewAll: {
          href: localizedHref(locale, buildEquipmentHubHref(locale)),
          label: dict.nav.shopAllEquipment,
        },
        links: equipmentBrandLinks,
      },
    ],
    promo: {
      href: localizedHref(locale, getBrandCatalogHref("pando-moto", locale)),
      image: "/JRH10015_L23.webp",
      imageAlt: "Pando Moto riding gear",
      tag: dict.nav.promoTag,
      headline: dict.nav.promoHeadline,
      cta: dict.nav.shopEquipment,
    },
  };
}

export function getEquipmentMegaMenu(
  locale: Locale,
  dict: Dictionary,
  tree?: EquipmentNavTree | null,
): MegaMenu {
  if (tree && (tree.forMen || tree.forWomen || tree.accessories || tree.helmets)) {
    return buildEquipmentMegaMenuFromTree(locale, dict, tree);
  }

  return buildEmptyEquipmentMegaMenu(locale, dict);
}

function resolveToolsHref(
  locale: Locale,
  toolsCategory?: Pick<WcCategoryEntry, "slug" | "languageCode" | "translations"> | null,
) {
  return toolsCategory
    ? buildShopCategoryHref(toolsCategory, locale)
    : buildToolsCategoryHref(locale);
}

function getCampaignBlogHref(locale: Locale, campaign: Campaign): string | null {
  const slug = campaign.blogSlugs?.[locale] ?? campaign.blogSlug;

  if (!slug) {
    return null;
  }

  return localizedHref(locale, `/blog/${slug}`);
}

export function getCampaignNavItem(
  locale: Locale,
  dict: Dictionary,
  now = Date.now(),
): PrimaryNavItem | null {
  const campaign = getActiveCampaigns(now).find((entry) =>
    entry.placements.includes("header-nav"),
  );

  if (!campaign) {
    return null;
  }

  const href = getCampaignBlogHref(locale, campaign);

  if (!href) {
    return null;
  }

  return {
    href,
    label: dict.nav.giveaway,
    group: "shop",
    accent: true,
  };
}

export function getShopNav(
  locale: Locale,
  dict: Dictionary,
  tree?: EquipmentNavTree | null,
  toolsCategory?: WcCategoryEntry | null,
): PrimaryNavItem[] {
  const items: PrimaryNavItem[] = [
    {
      href: localizedHref(locale, "/shop/motorcycles"),
      label: dict.nav.motorcycles,
      group: "shop",
    },
    {
      href: localizedHref(locale, buildEquipmentHubHref(locale)),
      label: dict.nav.equipment,
      group: "shop",
      megaMenu: getEquipmentMegaMenu(locale, dict, tree),
    },
  ];

  if (locale === "et") {
    items.push({
      href: localizedHref(locale, resolveToolsHref(locale, toolsCategory)),
      label: dict.nav.tools,
      group: "shop",
    });
  }

  const campaignNav = getCampaignNavItem(locale, dict);
  if (campaignNav) {
    items.push(campaignNav);
  }

  return items;
}

export function getSiteNav(locale: Locale, dict: Dictionary): PrimaryNavItem[] {
  return [
    {
      href: localizedHref(locale, "/blog"),
      label: dict.nav.blog,
      group: "site",
    },
    {
      href: localizedHref(locale, "/contact"),
      label: dict.nav.contact,
      group: "site",
    },
    {
      href: localizedHref(locale, "/about"),
      label: dict.nav.about,
      group: "site",
    },
  ];
}

export function getPrimaryNav(locale: Locale, dict: Dictionary) {
  return [...getShopNav(locale, dict), ...getSiteNav(locale, dict)];
}

export function getFooterShopLinks(
  locale: Locale,
  dict: Dictionary,
  toolsCategory?: WcCategoryEntry | null,
  tree?: EquipmentNavTree | null,
) {
  const links = [
    { href: localizedHref(locale, "/shop/motorcycles"), label: dict.nav.motorcycles },
    { href: localizedHref(locale, buildEquipmentHubHref(locale)), label: dict.nav.equipment },
    {
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.forMen, "for-men", locale),
      ),
      label: dict.footer.mensGear,
    },
    {
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.forWomen, "for-women", locale),
      ),
      label: dict.footer.womensGear,
    },
    {
      href: localizedHref(
        locale,
        buildEquipmentRootCategoryHref(tree?.accessories, "accessories", locale),
      ),
      label: dict.footer.accessories,
    },
  ];

  if (locale === "et") {
    links.push({
      href: localizedHref(locale, resolveToolsHref(locale, toolsCategory)),
      label: dict.nav.tools,
    });
  }

  return links;
}

export function getFooterQuickLinks(locale: Locale, dict: Dictionary) {
  const links = [
    { href: localizedHref(locale, "/search"), label: dict.footer.search },
    { href: localizedHref(locale, "/shop/motorcycles"), label: dict.footer.brands },
    { href: localizedHref(locale, "/wishlist"), label: dict.wishlist.open },
    { href: localizedHref(locale, "/cart"), label: dict.footer.cartCheckout },
    { href: localizedHref(locale, "/test-ride"), label: dict.footer.testRide },
  ];

  return links;
}

export function getFooterCompanyLinks(locale: Locale, dict: Dictionary) {
  return [
    { href: localizedHref(locale, "/about"), label: dict.nav.about },
    { href: localizedHref(locale, "/contact"), label: dict.nav.contact },
    { href: localizedHref(locale, "/blog"), label: dict.nav.blog },
  ];
}

export function getFooterLegalLinks(locale: Locale, dict: Dictionary) {
  return [
    { href: localizedHref(locale, "/support"), label: dict.footer.support },
    { href: localizedHref(locale, "/terms"), label: dict.footer.terms },
    { href: localizedHref(locale, "/privacy"), label: dict.footer.privacy },
    { href: localizedHref(locale, "/returns"), label: dict.footer.returns },
    {
      href: localizedHref(locale, "/returns#withdrawal-form"),
      label: dict.footer.returnProduct,
    },
    { href: localizedHref(locale, "/shipping"), label: dict.footer.shipping },
    { href: localizedHref(locale, "/cookies"), label: dict.footer.cookies },
  ];
}
