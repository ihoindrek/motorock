import type {
  CatalogProduct,
  ProductCategory,
  ProductGender,
} from "@/types/catalog-product";
import {
  ACCESSORY_CATEGORIES,
  CATEGORY_TO_WC_SLUG,
  PROTECTION_CATEGORIES,
} from "@/lib/shop/wc-categories";

export type EquipmentCatalogWhere = {
  category?: string;
  categoryNotIn?: string[];
};

export function resolveEquipmentCatalogWhere(
  route: CategoryRoute,
): EquipmentCatalogWhere {
  if (route.brand) {
    return { categoryNotIn: ["motorcycles", "tools-maintenance"] };
  }

  if (route.gender === "men") {
    return { category: "for-men" };
  }

  if (route.gender === "women") {
    return { category: "for-women" };
  }

  if (route.accessoriesOnly) {
    return { category: "accessories" };
  }

  if (route.protectionOnly) {
    return { categoryNotIn: ["motorcycles", "tools-maintenance"] };
  }

  if (route.category) {
    const wcSlug = CATEGORY_TO_WC_SLUG[route.category];
    if (wcSlug) {
      return { category: wcSlug };
    }
  }

  return { categoryNotIn: ["motorcycles", "tools-maintenance"] };
}

export type Breadcrumb = {
  label: string;
  href: string;
};

export type CategoryRoute = {
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  gender?: ProductGender;
  category?: ProductCategory;
  brand?: string;
  protectionOnly?: boolean;
  accessoriesOnly?: boolean;
};

export const categoryLabels: Record<ProductCategory, string> = {
  jackets: "Jackets & tags",
  vests: "Vests",
  pants: "Pants & jeans",
  gloves: "Gloves",
  footwear: "Footwear",
  hoodies: "Hoodies & sweaters",
  "t-shirts": "T-shirts & jerseys",
  "base-layers": "Base layers",
  helmets: "Helmets",
  "helmet-accessories": "Helmet accessories",
  goggles: "Goggles",
  headwear: "Headwear",
  bags: "Bags & backpacks",
  belts: "Belts",
  jewelry: "Jewelry",
  scarves: "Scarves & tubulars",
  socks: "Socks",
  safety: "Safety & protection",
  accessories: "Accessories",
  tools: "Tools & maintenance",
  other: "Other",
  motorcycles: "Motorcycles",
};

const routeCategorySlugs = new Set<string>(
  Object.keys(categoryLabels).filter((slug) => slug !== "motorcycles"),
);

export function isRouteCategorySlug(slug: string): slug is ProductCategory {
  return routeCategorySlugs.has(slug);
}

export function getCategoryLabel(category: ProductCategory) {
  return categoryLabels[category];
}

export const motorcyclesCatalogRoute: CategoryRoute = {
  title: "Motorcycles",
  description:
    "Urban scramblers and custom soul — machines built for riders who refuse to blend in.",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Motorcycles", href: "/shop/motorcycles" },
  ],
  category: "motorcycles",
};

export const toolsCatalogRoute: CategoryRoute = {
  title: "Tools & Maintenance",
  description:
    "Workshop essentials, maintenance kits, and tools to keep your machine road-ready.",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Tools & Maintenance", href: "/shop/tools" },
  ],
  category: "tools",
};

export function parseEquipmentSlug(slug: string[] = []): CategoryRoute {
  const breadcrumbs: Breadcrumb[] = [
    { label: "Home", href: "/" },
    { label: "Driving Equipment", href: "/shop/equipment" },
  ];

  if (slug.length === 0) {
    return {
      title: "Driving Equipment",
      description:
        "Premium riding gear for men and women — jackets, protection, and rebel essentials.",
      breadcrumbs,
    };
  }

  if (slug[0] === "men") {
    breadcrumbs.push({ label: "Men", href: "/shop/equipment/men" });

    if (slug[1] && isRouteCategorySlug(slug[1])) {
      const category = slug[1];
      breadcrumbs.push({
        label: categoryLabels[category],
        href: `/shop/equipment/men/${category}`,
      });

      return {
        title: `Men's ${categoryLabels[category]}`,
        description: `Men's ${categoryLabels[category].toLowerCase()} — built for the ride.`,
        breadcrumbs,
        gender: "men",
        category,
      };
    }

    return {
      title: "Men's riding gear",
      description: "Jackets, pants, gloves and more — engineered for riders.",
      breadcrumbs,
      gender: "men",
    };
  }

  if (slug[0] === "women") {
    breadcrumbs.push({ label: "Women", href: "/shop/equipment/women" });

    if (slug[1] && isRouteCategorySlug(slug[1])) {
      const category = slug[1];
      breadcrumbs.push({
        label: categoryLabels[category],
        href: `/shop/equipment/women/${category}`,
      });

      return {
        title: `Women's ${categoryLabels[category]}`,
        description: `Women's ${categoryLabels[category].toLowerCase()} — style meets protection.`,
        breadcrumbs,
        gender: "women",
        category,
      };
    }

    return {
      title: "Women's riding gear",
      description: "Riding gear designed for women who refuse to blend in.",
      breadcrumbs,
      gender: "women",
    };
  }

  if (slug[0] === "protection") {
    breadcrumbs.push({
      label: "Protection",
      href: "/shop/equipment/protection",
    });

    return {
      title: "Protection & safety",
      description: "Helmets, goggles and CE-rated protection for every ride.",
      breadcrumbs,
      protectionOnly: true,
    };
  }

  if (slug[0] === "accessories") {
    breadcrumbs.push({
      label: "Accessories",
      href: "/shop/equipment/accessories",
    });

    if (slug[1] && isRouteCategorySlug(slug[1])) {
      const category = slug[1];
      breadcrumbs.push({
        label: categoryLabels[category],
        href: `/shop/equipment/accessories/${category}`,
      });

      return {
        title: categoryLabels[category],
        description: `${categoryLabels[category]} for riders who demand more.`,
        breadcrumbs,
        category,
      };
    }

    return {
      title: "Accessories",
      description: "Goggles, headwear, bags, and the finishing details for every ride.",
      breadcrumbs,
      accessoriesOnly: true,
    };
  }

  if (slug[0] === "armour") {
    return parseEquipmentSlug(["safety"]);
  }

  if (slug[0] && isRouteCategorySlug(slug[0])) {
    const category = slug[0];
    breadcrumbs.push({
      label: categoryLabels[category],
      href: `/shop/equipment/${category}`,
    });

    return {
      title: categoryLabels[category],
      description: `${categoryLabels[category]} for riders who demand more.`,
      breadcrumbs,
      category,
    };
  }

  return {
    title: "Driving Equipment",
    description: "Browse our riding gear collection.",
    breadcrumbs,
  };
}

export function filterProductsByRoute(
  products: readonly CatalogProduct[],
  route: CategoryRoute,
) {
  return products.filter((product) => {
    if (product.category === "tools" && route.category !== "tools") {
      return false;
    }

    if (route.gender === "men" || route.gender === "women") {
      const audiences = product.shopAudiences ?? [];

      if (audiences.length > 0) {
        if (!audiences.includes(route.gender)) {
          return false;
        }
      } else if (product.gender !== route.gender) {
        return false;
      }
    }

    if (route.category && product.category !== route.category) {
      return false;
    }

    if (
      route.protectionOnly &&
      !PROTECTION_CATEGORIES.includes(product.category)
    ) {
      return false;
    }

    if (
      route.accessoriesOnly &&
      !ACCESSORY_CATEGORIES.includes(product.category)
    ) {
      return false;
    }

    if (route.brand && product.brand !== route.brand) {
      return false;
    }

    return true;
  });
}

export const searchResultsRoute: CategoryRoute = {
  title: "Search",
  description: "Search the Motorock catalog.",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
  ],
};

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "price-mid";

function medianPrice(prices: readonly number[]) {
  if (prices.length === 0) {
    return 0;
  }

  const sorted = [...prices].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export function defaultSortForRoute(route: CategoryRoute): SortOption {
  if (route.category === "motorcycles") {
    return "price-mid";
  }

  return "featured";
}

export function sortProducts(
  products: CatalogProduct[],
  sort: SortOption,
) {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    case "price-mid": {
      const median = medianPrice(sorted.map((product) => product.price));

      return sorted.sort((a, b) => {
        const distance = Math.abs(a.price - median) - Math.abs(b.price - median);
        if (distance !== 0) {
          return distance;
        }

        return b.price - a.price || a.name.localeCompare(b.name);
      });
    }
    default:
      return sorted.sort(
        (a, b) => Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name),
      );
  }
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}
