import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Compact per-variation facts so prompts can reference real sizes/colors/stock. */
function buildVariationsJson(product: NormalizedProduct) {
  if (product.variations.length === 0) {
    return "[]";
  }

  return JSON.stringify(
    product.variations.slice(0, 30).map((variation) => ({
      attributes: variation.attributes,
      ...(variation.price !== undefined && variation.price !== product.price
        ? { price: variation.price }
        : {}),
      inStock: variation.inStock,
    })),
    null,
    2,
  );
}

export function buildProductPromptVariables(product: NormalizedProduct) {
  const existingLong = stripHtml(product.existing.description ?? "");

  return {
    locale: product.locale,
    name: product.name,
    brand: product.brand ?? "",
    sku: product.sku ?? "",
    productType: product.productType,
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
    variationsJson: buildVariationsJson(product),
    imageCountMinusOne: String(Math.max(product.images.length - 1, 0)),
    existingShort: product.existing.shortDescription ?? "",
    /** Plain-text excerpt of the current long description (supplier copy etc.). */
    existingDescriptionExcerpt: existingLong.slice(0, 1200),
    imagesJson: JSON.stringify(
      product.images.map((image, index) => ({
        index,
        altText: image.altText ?? "",
        url: image.url,
      })),
      null,
      2,
    ),
  };
}
