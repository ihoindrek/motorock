import type {
  CatalogProduct,
  ProductCategory,
  ProductGender,
} from "@/types/catalog-product";
import type { Dictionary } from "@/i18n/dictionaries/en";
import {
  productInAccessoriesBranch,
  productInProtectionBranch,
  productInToolsCategory,
  productMatchesWcCategoryRoute,
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

  if (route.wcCategorySlug) {
    return { category: route.wcCategorySlug };
  }

  if (route.protectionOnly) {
    return { categoryNotIn: ["motorcycles", "tools-maintenance"] };
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
  /** WooCommerce category slug used for GraphQL catalog filter. */
  wcCategorySlug?: string;
  wcCategoryPath?: readonly string[];
  gender?: ProductGender;
  category?: ProductCategory;
  brand?: string;
  protectionOnly?: boolean;
  accessoriesOnly?: boolean;
};

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

export function buildMotorcyclesCatalogRoute(
  dict: Dictionary,
  brand?: string,
): CategoryRoute {
  const base: CategoryRoute = {
    title: dict.pages.motorcyclesTitle,
    description: dict.pages.motorcyclesDescription,
    breadcrumbs: [
      { label: dict.pdp.breadcrumbHome, href: "/" },
      { label: dict.nav.motorcycles, href: "/shop/motorcycles" },
    ],
    category: "motorcycles",
  };

  if (!brand) {
    return base;
  }

  const brandSlug = brand.toLowerCase().replace(/\s+/g, "-");

  return {
    ...base,
    brand,
    title: dict.catalog.brandMotorcyclesTitle.replace("{brand}", brand),
    description: dict.catalog.brandMotorcyclesDescription.replace(
      "{brand}",
      brand,
    ),
    breadcrumbs: [
      ...base.breadcrumbs,
      {
        label: brand,
        href: `/shop/motorcycles?brand=${brandSlug}`,
      },
    ],
  };
}

export function filterProductsByRoute(
  products: readonly CatalogProduct[],
  route: CategoryRoute,
) {
  return products.filter((product) => {
    if (route.category === "tools") {
      return productInToolsCategory(product.wcCategorySlugs);
    }

    if (route.category === "motorcycles") {
      return product.type === "motorcycle";
    }

    if (productInToolsCategory(product.wcCategorySlugs)) {
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

    if (
      route.wcCategorySlug &&
      !productMatchesWcCategoryRoute(product.wcCategorySlugs, route.wcCategorySlug)
    ) {
      // Gender roots: products often only list the child slug (e.g. pants-jeans).
      // Fall back to shopAudiences, which already accounts for parent categories.
      const audienceFallback =
        (route.wcCategorySlug === "for-women" &&
          product.shopAudiences?.includes("women")) ||
        (route.wcCategorySlug === "for-men" &&
          product.shopAudiences?.includes("men"));

      if (!audienceFallback) {
        return false;
      }
    }

    if (route.protectionOnly && !productInProtectionBranch(product.wcCategorySlugs)) {
      return false;
    }

    if (route.accessoriesOnly && !productInAccessoriesBranch(product.wcCategorySlugs)) {
      return false;
    }

    if (route.brand && product.brand !== route.brand) {
      return false;
    }

    return true;
  });
}

export type CategoryFilterFacets = {
  showSizeFilter: boolean;
  showBrandFilter: boolean;
  showCategoryFilter: boolean;
};

export function productHasSizeOptions(product: CatalogProduct): boolean {
  return (
    product.type === "equipment" &&
    product.category !== "tools" &&
    product.sizes.some((size) => size !== "One size")
  );
}

export function resolveCategoryFilterFacets(
  route: CategoryRoute,
  products: readonly CatalogProduct[],
): CategoryFilterFacets {
  const brands = new Set(
    products.map((product) => product.brand).filter(Boolean),
  );

  if (route.category === "motorcycles") {
    return {
      showSizeFilter: false,
      showBrandFilter: true,
      showCategoryFilter: false,
    };
  }

  if (route.category === "tools") {
    return {
      showSizeFilter: false,
      showBrandFilter: brands.size > 1,
      showCategoryFilter: false,
    };
  }

  // Equipment categories (for-women, for-men, accessories, …):
  // always expose brand filter unless this is a single-brand archive page.
  return {
    showSizeFilter: products.some(productHasSizeOptions),
    showBrandFilter: !route.brand,
    showCategoryFilter: true,
  };
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

export function formatPrice(price: number, locale: "en" | "et" = "et") {
  const intlLocale = locale === "et" ? "et-EE" : "en-GB";
  const hasCents = Math.abs(price - Math.round(price)) > 0.001;

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })
    .format(price)
    .replace(/ /g, "\u00a0");
}

/** Checkout / Woo totals — keep cents like the classic WooCommerce checkout. */
export function formatCheckoutPrice(price: number, locale: "en" | "et" = "et") {
  const intlLocale = locale === "et" ? "et-EE" : "en-GB";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(price)
    .replace(/ /g, "\u00a0");
}
