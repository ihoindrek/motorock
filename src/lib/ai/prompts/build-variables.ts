import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

export function buildProductPromptVariables(product: NormalizedProduct) {
  return {
    locale: product.locale,
    name: product.name,
    brand: product.brand ?? "",
    categoryPath: product.categoryPath.join(" > ") || product.category || "",
    price: String(product.price),
    inStock: product.inStock ? "yes" : "no",
    attributesJson: JSON.stringify(
      product.attributes.map((attribute) => ({
        name: attribute.name,
        values: attribute.values,
      })),
      null,
      2,
    ),
    variationCount: String(product.variations.length),
    existingShort: product.existing.shortDescription ?? "",
  };
}
