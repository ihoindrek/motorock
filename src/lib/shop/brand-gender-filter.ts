import type { Dictionary } from "@/i18n/dictionaries/en";
import type { CatalogProduct } from "@/types/catalog-product";

export type BrandGenderFilterId = "men" | "women";

export type BrandGenderFilterOption = {
  id: BrandGenderFilterId;
  label: string;
};

/** Matches equipment gender routes (`filterProductsByRoute`). */
export function productMatchesBrandGenderFilter(
  product: CatalogProduct,
  gender: BrandGenderFilterId,
): boolean {
  const audiences = product.shopAudiences ?? [];

  if (audiences.length > 0) {
    return audiences.includes(gender);
  }

  return product.gender === gender;
}

export function productMatchesBrandGenderFilters(
  product: CatalogProduct,
  genders: readonly BrandGenderFilterId[],
): boolean {
  if (genders.length === 0) {
    return true;
  }

  return genders.some((gender) =>
    productMatchesBrandGenderFilter(product, gender),
  );
}

export function resolveAvailableBrandGenders(
  products: readonly CatalogProduct[],
  dict: Dictionary,
): BrandGenderFilterOption[] {
  const options: BrandGenderFilterOption[] = [];

  if (products.some((product) => productMatchesBrandGenderFilter(product, "men"))) {
    options.push({ id: "men", label: dict.nav.forMen });
  }

  if (
    products.some((product) => productMatchesBrandGenderFilter(product, "women"))
  ) {
    options.push({ id: "women", label: dict.nav.forWomen });
  }

  return options;
}

export function shouldShowBrandGenderFilter(
  routeBrand: string | undefined,
  options: readonly BrandGenderFilterOption[],
) {
  return Boolean(routeBrand) && options.length > 1;
}

export function matchBrandGendersFromParam(
  param: string,
  options: readonly BrandGenderFilterOption[],
): BrandGenderFilterId[] {
  const wanted = new Set(
    param
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return options
    .filter((option) => wanted.has(option.id))
    .map((option) => option.id);
}
