export type NavLink = {
  href: string;
  label: string;
};

export type NavColumn = {
  title: string;
  viewAll: NavLink;
  links: readonly NavLink[];
};

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

import { getBrandCatalogHref } from "@/lib/shop/brand-catalog-url";

const equipmentBrandSlugs = [
  { slug: "pando-moto", label: "Pando Moto" },
  { slug: "holyfreedom", label: "Holyfreedom" },
  { slug: "johnny-reb", label: "Johnny Reb" },
  { slug: "bobhead", label: "Bobhead" },
  { slug: "motogirl", label: "Motogirl" },
] as const;

const equipmentBrandLinks = equipmentBrandSlugs.map(({ slug, label }) => ({
  href: getBrandCatalogHref(slug),
  label,
}));

export const equipmentMegaMenu = {
  columns: [
    {
      title: "For men",
      viewAll: { href: "/shop/equipment/men", label: "View all men's gear" },
      links: menGearLinks,
    },
    {
      title: "For women",
      viewAll: { href: "/shop/equipment/women", label: "View all women's gear" },
      links: womenGearLinks,
    },
    {
      title: "Accessories & protection",
      viewAll: {
        href: "/shop/equipment/accessories",
        label: "View all accessories",
      },
      links: [
        { href: "/shop/equipment/helmets", label: "Helmets" },
        { href: "/shop/equipment/goggles", label: "Goggles" },
        { href: "/shop/equipment/headwear", label: "Headwear" },
        { href: "/shop/equipment/bags", label: "Bags & backpacks" },
        { href: "/shop/equipment/safety", label: "Safety & protection" },
        { href: "/shop/equipment/scarves", label: "Scarves & tubulars" },
      ],
    },
    {
      title: "Brands",
      viewAll: { href: "/shop/equipment", label: "Shop all equipment" },
      links: equipmentBrandLinks,
    },
  ],
  promo: {
    href: getBrandCatalogHref("pando-moto"),
    image: "/JRH10015_L23.webp",
    imageAlt: "Pando Moto riding gear",
    tag: "New in",
    headline: "Pando Moto 2026 collection in stock",
    cta: "Shop equipment",
  },
};

export type MegaMenu = {
  columns: NavColumn[];
  promo: {
    href: string;
    image: string;
    imageAlt: string;
    tag: string;
    headline: string;
    cta: string;
  };
};

export type NavGroup = "shop" | "site";

export type PrimaryNavItem =
  | { href: string; label: string; group: NavGroup; megaMenu?: undefined }
  | {
      href: string;
      label: string;
      group: NavGroup;
      megaMenu: MegaMenu;
    };

export const shopNav: readonly PrimaryNavItem[] = [
  { href: "/shop/motorcycles", label: "Motorcycles", group: "shop" },
  {
    href: "/shop/equipment",
    label: "Driving Equipment",
    group: "shop",
    megaMenu: equipmentMegaMenu,
  },
  { href: "/shop/tools", label: "Tools", group: "shop" },
];

export const siteNav: readonly PrimaryNavItem[] = [
  { href: "/blog", label: "Blog", group: "site" },
  { href: "/contact", label: "Contact", group: "site" },
  { href: "/about", label: "About", group: "site" },
];

export const primaryNav: readonly PrimaryNavItem[] = [...shopNav, ...siteNav];
