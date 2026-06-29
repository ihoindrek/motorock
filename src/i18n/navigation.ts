import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import type { EquipmentNavTree, WcCategoryNode } from "@/lib/graphql/categories";
import { getLocalizedCategoryName } from "@/lib/graphql/categories";
import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";
import { buildEquipmentCategoryHref } from "@/lib/shop/equipment-route";
import type { MegaMenu, NavColumn, NavLink, PrimaryNavItem } from "@/data/navigation";

const equipmentBrandSlugs = [
  { slug: "pando-moto", label: "Pando Moto" },
  { slug: "holyfreedom", label: "Holyfreedom" },
  { slug: "johnny-reb", label: "Johnny Reb" },
  { slug: "bobhead", label: "Bobhead" },
  { slug: "motogirl", label: "Motogirl" },
] as const;

function prefixLinks(locale: Locale, links: readonly { href: string; label: string }[]): NavLink[] {
  return links.map((link) => ({
    href: localizedHref(locale, link.href),
    label: link.label,
  }));
}

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
  parentWcSlug: string,
  children: readonly WcCategoryNode[],
): NavLink[] {
  const links: NavLink[] = [];

  for (const child of sortCategoryChildren(children)) {
    links.push({
      href: localizedHref(
        locale,
        buildEquipmentCategoryHref(parentWcSlug, child.slug),
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
    href: localizedHref(locale, getBrandCatalogHref(slug)),
    label,
  }));

  const accessoriesLinks: NavLink[] = [];

  if (tree.helmets) {
    accessoriesLinks.push({
      href: localizedHref(locale, buildEquipmentCategoryHref("helmets")),
      label: getLocalizedCategoryName(tree.helmets, locale),
    });
  }

  if (tree.accessories?.children?.nodes.length) {
    for (const link of buildCategoryColumnLinks(
      locale,
      "accessories",
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
        href: localizedHref(locale, buildEquipmentCategoryHref("for-men")),
        label: dict.nav.viewAllMens,
      },
      links: tree.forMen?.children?.nodes.length
        ? buildCategoryColumnLinks(locale, "for-men", tree.forMen.children.nodes)
        : [],
    },
    {
      id: "women",
      title: dict.nav.forWomen,
      viewAll: {
        href: localizedHref(locale, buildEquipmentCategoryHref("for-women")),
        label: dict.nav.viewAllWomens,
      },
      links: tree.forWomen?.children?.nodes.length
        ? buildCategoryColumnLinks(locale, "for-women", tree.forWomen.children.nodes)
        : [],
    },
    {
      id: "accessories",
      title: dict.nav.accessories,
      viewAll: {
        href: localizedHref(locale, buildEquipmentCategoryHref("accessories")),
        label: dict.nav.viewAllAccessories,
      },
      links: accessoriesLinks,
    },
    {
      id: "brands",
      title: dict.nav.brands,
      viewAll: {
        href: localizedHref(locale, "/shop/equipment"),
        label: dict.nav.shopAllEquipment,
      },
      links: equipmentBrandLinks,
    },
  ];

  return {
    columns,
    promo: {
      href: localizedHref(locale, getBrandCatalogHref("pando-moto")),
      image: "/JRH10015_L23.webp",
      imageAlt: "Pando Moto riding gear",
      tag: dict.nav.promoTag,
      headline: dict.nav.promoHeadline,
      cta: dict.nav.shopEquipment,
    },
  };
}

function buildStaticEquipmentMegaMenu(locale: Locale, dict: Dictionary): MegaMenu {
  const labels = dict.equipmentMenu;

  const menGearLinks = [
    { href: buildEquipmentCategoryHref("for-men", "jackets-and-tags"), label: labels.jackets },
    { href: buildEquipmentCategoryHref("for-men", "vests-2"), label: labels.vests },
    { href: buildEquipmentCategoryHref("for-men", "mens-pants"), label: labels.pants },
    { href: buildEquipmentCategoryHref("for-men", "gloves"), label: labels.gloves },
    { href: buildEquipmentCategoryHref("for-men", "footwear"), label: labels.footwear },
    { href: buildEquipmentCategoryHref("for-men", "sweaters"), label: labels.hoodies },
    { href: buildEquipmentCategoryHref("for-men", "t-shirts"), label: labels.tshirts },
    { href: buildEquipmentCategoryHref("for-men", "base-layer-warm-underwear"), label: labels.baseLayers },
  ] as const;

  const womenGearLinks = [
    { href: buildEquipmentCategoryHref("for-women", "jackets-and-tags-2"), label: labels.jackets },
    { href: buildEquipmentCategoryHref("for-women", "vests-3"), label: labels.vests },
    { href: buildEquipmentCategoryHref("for-women", "pants-jeans"), label: labels.pants },
    { href: buildEquipmentCategoryHref("for-women", "gloves-2"), label: labels.gloves },
    { href: buildEquipmentCategoryHref("for-women", "footwear-2"), label: labels.footwear },
    { href: buildEquipmentCategoryHref("for-women", "hoodies-sweatshirts"), label: labels.hoodies },
    { href: buildEquipmentCategoryHref("for-women", "t-shirts-jerseys"), label: labels.tshirts },
    { href: buildEquipmentCategoryHref("for-women", "base-layer-warm-underwear-2"), label: labels.baseLayers },
  ] as const;

  const equipmentBrandLinks = equipmentBrandSlugs.map(({ slug, label }) => ({
    href: localizedHref(locale, getBrandCatalogHref(slug)),
    label,
  }));

  const columns: NavColumn[] = [
    {
      id: "men",
      title: dict.nav.forMen,
      viewAll: {
        href: localizedHref(locale, buildEquipmentCategoryHref("for-men")),
        label: dict.nav.viewAllMens,
      },
      links: prefixLinks(locale, menGearLinks),
    },
    {
      id: "women",
      title: dict.nav.forWomen,
      viewAll: {
        href: localizedHref(locale, buildEquipmentCategoryHref("for-women")),
        label: dict.nav.viewAllWomens,
      },
      links: prefixLinks(locale, womenGearLinks),
    },
    {
      id: "accessories",
      title: dict.nav.accessories,
      viewAll: {
        href: localizedHref(locale, buildEquipmentCategoryHref("accessories")),
        label: dict.nav.viewAllAccessories,
      },
      links: prefixLinks(locale, [
        { href: buildEquipmentCategoryHref("helmets"), label: labels.helmets },
        { href: buildEquipmentCategoryHref("accessories", "goggles"), label: labels.goggles },
        { href: buildEquipmentCategoryHref("accessories", "headwear"), label: labels.headwear },
        { href: buildEquipmentCategoryHref("accessories", "bags-backpacks"), label: labels.bags },
        { href: buildEquipmentCategoryHref("accessories", "safety"), label: labels.safety },
        { href: buildEquipmentCategoryHref("accessories", "scarves-tubulars"), label: labels.scarves },
      ]),
    },
    {
      id: "brands",
      title: dict.nav.brands,
      viewAll: {
        href: localizedHref(locale, "/shop/equipment"),
        label: dict.nav.shopAllEquipment,
      },
      links: equipmentBrandLinks,
    },
  ];

  return {
    columns,
    promo: {
      href: localizedHref(locale, getBrandCatalogHref("pando-moto")),
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
  if (tree && (tree.forMen || tree.forWomen || tree.accessories)) {
    return buildEquipmentMegaMenuFromTree(locale, dict, tree);
  }

  return buildStaticEquipmentMegaMenu(locale, dict);
}

export function getShopNav(
  locale: Locale,
  dict: Dictionary,
  tree?: EquipmentNavTree | null,
): PrimaryNavItem[] {
  const items: PrimaryNavItem[] = [
    {
      href: localizedHref(locale, "/shop/motorcycles"),
      label: dict.nav.motorcycles,
      group: "shop",
    },
    {
      href: localizedHref(locale, "/shop/equipment"),
      label: dict.nav.equipment,
      group: "shop",
      megaMenu: getEquipmentMegaMenu(locale, dict, tree),
    },
  ];

  if (locale === "et") {
    items.push({
      href: localizedHref(locale, "/shop/tools"),
      label: dict.nav.tools,
      group: "shop",
    });
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

export function getFooterShopLinks(locale: Locale, dict: Dictionary) {
  const links = [
    { href: localizedHref(locale, "/shop/motorcycles"), label: dict.nav.motorcycles },
    { href: localizedHref(locale, "/shop/equipment"), label: dict.nav.equipment },
    { href: localizedHref(locale, buildEquipmentCategoryHref("for-men")), label: dict.footer.mensGear },
    { href: localizedHref(locale, buildEquipmentCategoryHref("for-women")), label: dict.footer.womensGear },
    { href: localizedHref(locale, buildEquipmentCategoryHref("accessories")), label: dict.footer.accessories },
  ];

  if (locale === "et") {
    links.push({
      href: localizedHref(locale, "/shop/tools"),
      label: dict.nav.tools,
    });
  }

  return links;
}

export function getFooterQuickLinks(locale: Locale, dict: Dictionary) {
  const links = [
    { href: localizedHref(locale, "/search"), label: dict.footer.search },
    { href: localizedHref(locale, "/shop/motorcycles"), label: dict.footer.brands },
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
    { href: localizedHref(locale, "/privacy"), label: dict.footer.privacy },
    { href: localizedHref(locale, "/terms"), label: dict.footer.terms },
    { href: localizedHref(locale, "/shipping"), label: dict.footer.shipping },
  ];
}
