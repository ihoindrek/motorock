import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";
import type { NavColumn, NavLink, PrimaryNavItem } from "@/data/navigation";

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

export function getEquipmentMegaMenu(locale: Locale, dict: Dictionary) {
  const menGearLinks = [
    { href: "/shop/equipment/men/jackets", label: "Jackets & tags" },
    { href: "/shop/equipment/men/vests", label: "Vests" },
    { href: "/shop/equipment/men/pants", label: "Pants & jeans" },
    { href: "/shop/equipment/men/gloves", label: "Gloves" },
    { href: "/shop/equipment/men/footwear", label: "Footwear" },
    { href: "/shop/equipment/men/hoodies", label: "Hoodies & sweaters" },
    { href: "/shop/equipment/men/t-shirts", label: "T-shirts & jerseys" },
    { href: "/shop/equipment/men/base-layers", label: "Base layers" },
  ] as const;

  const womenGearLinks = [
    { href: "/shop/equipment/women/jackets", label: "Jackets & tags" },
    { href: "/shop/equipment/women/vests", label: "Vests" },
    { href: "/shop/equipment/women/pants", label: "Pants & jeans" },
    { href: "/shop/equipment/women/gloves", label: "Gloves" },
    { href: "/shop/equipment/women/footwear", label: "Footwear" },
    { href: "/shop/equipment/women/hoodies", label: "Hoodies & sweaters" },
    { href: "/shop/equipment/women/t-shirts", label: "T-shirts & jerseys" },
    { href: "/shop/equipment/women/base-layers", label: "Base layers" },
  ] as const;

  const equipmentBrandLinks = equipmentBrandSlugs.map(({ slug, label }) => ({
    href: localizedHref(locale, getBrandCatalogHref(slug)),
    label,
  }));

  const columns: NavColumn[] = [
    {
      title: dict.nav.forMen,
      viewAll: {
        href: localizedHref(locale, "/shop/equipment/men"),
        label: dict.nav.viewAllMens,
      },
      links: prefixLinks(locale, menGearLinks),
    },
    {
      title: dict.nav.forWomen,
      viewAll: {
        href: localizedHref(locale, "/shop/equipment/women"),
        label: dict.nav.viewAllWomens,
      },
      links: prefixLinks(locale, womenGearLinks),
    },
    {
      title: dict.nav.accessories,
      viewAll: {
        href: localizedHref(locale, "/shop/equipment/accessories"),
        label: dict.nav.viewAllAccessories,
      },
      links: prefixLinks(locale, [
        { href: "/shop/equipment/helmets", label: "Helmets" },
        { href: "/shop/equipment/goggles", label: "Goggles" },
        { href: "/shop/equipment/headwear", label: "Headwear" },
        { href: "/shop/equipment/bags", label: "Bags & backpacks" },
        { href: "/shop/equipment/safety", label: "Safety & protection" },
        { href: "/shop/equipment/scarves", label: "Scarves & tubulars" },
      ]),
    },
    {
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

export function getShopNav(locale: Locale, dict: Dictionary): PrimaryNavItem[] {
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
      megaMenu: getEquipmentMegaMenu(locale, dict),
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
    { href: localizedHref(locale, "/shop/equipment/men"), label: dict.footer.mensGear },
    { href: localizedHref(locale, "/shop/equipment/women"), label: dict.footer.womensGear },
    { href: localizedHref(locale, "/shop/equipment/accessories"), label: dict.footer.accessories },
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
