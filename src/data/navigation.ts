export type NavLink = {
  href: string;
  label: string;
};

export type NavColumnId = "men" | "women" | "accessories" | "brands";

export type NavColumn = {
  id: NavColumnId;
  title: string;
  viewAll: NavLink;
  links: readonly NavLink[];
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

export type PrimaryNavItem = {
  href: string;
  label: string;
  group: NavGroup;
  accent?: boolean;
  megaMenu?: MegaMenu;
};
