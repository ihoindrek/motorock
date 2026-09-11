import { brands } from "@/data/brands";
import type { GraphQLProductAttribute } from "@/lib/graphql/types";
import { resolveBrandFromProductAttributes } from "@/lib/shop/resolve-product-brand";

export function storefrontBrandNames(): string[] {
  return brands.map((brand) => brand.name).filter(Boolean);
}

export function formatBrandListForPrompt(names: readonly string[]): string {
  if (names.length === 0) {
    return "None";
  }

  return names.join(", ");
}

export function collectStorefrontBrandsFromProducts(
  products: ReadonlyArray<{ attributes?: { nodes: GraphQLProductAttribute[] } | null }>,
): string[] {
  const found = new Set<string>();

  for (const product of products) {
    const brand = resolveBrandFromProductAttributes(product.attributes);
    if (brand && storefrontBrandNames().includes(brand)) {
      found.add(brand);
    }
  }

  return [...found].sort((a, b) => a.localeCompare(b));
}
