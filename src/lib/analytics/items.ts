import type { CartLine } from "@/context/cart-context";
import type { OrderSummary } from "@/app/api/order/summary/route";
import type {
  CatalogProduct,
  ProductCategory,
  ProductType,
} from "@/types/catalog-product";
import type { Ga4Item } from "@/lib/analytics/types";

function formatItemCategory(
  type: ProductType | undefined,
  category?: ProductCategory,
) {
  if (category === "motorcycles" || type === "motorcycle") {
    return "Motorcycles";
  }

  if (category) {
    return category
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return type === "equipment" ? "Equipment" : "Shop";
}

/** Meta catalog lists each variation as its own content id (not the parent group id). */
export function metaContentId(
  productId?: number | null,
  fallback?: string | null,
  variationId?: number | null,
): string {
  if (variationId != null && variationId > 0) {
    return String(variationId);
  }

  if (productId != null && productId > 0) {
    return String(productId);
  }

  return fallback?.trim() || "";
}

export function mapCatalogProductToGa4Item(
  product: Pick<
    CatalogProduct,
    "slug" | "name" | "brand" | "price" | "type" | "category" | "sku" | "databaseId"
  >,
  index?: number,
  variationId?: number,
): Ga4Item {
  return {
    item_id:
      metaContentId(product.databaseId, product.sku ?? product.slug, variationId) ||
      product.slug,
    item_name: product.name,
    item_brand: product.brand,
    item_category: formatItemCategory(product.type, product.category),
    price: product.price,
    quantity: 1,
    index,
  };
}

export function mapCartLineToGa4Item(line: CartLine, index?: number): Ga4Item {
  const variant = [line.size, line.color].filter(Boolean).join(" / ");

  return {
    item_id:
      metaContentId(line.productId, line.slug, line.variationId) || line.slug,
    item_name: line.name,
    item_brand: line.brand,
    item_category: formatItemCategory(line.type),
    item_variant: variant || undefined,
    price: line.price,
    quantity: line.quantity,
    index,
  };
}

export function mapCartLinesToGa4Items(lines: readonly CartLine[]): Ga4Item[] {
  return lines.map((line, index) => mapCartLineToGa4Item(line, index));
}

export function mapOrderSummaryItemsToGa4Items(
  items: OrderSummary["items"],
): Ga4Item[] {
  return items.map((item, index) => ({
    item_id:
      metaContentId(item.productId, item.sku ?? item.name) || item.name,
    item_name: item.name,
    price: item.quantity > 0 ? item.total / item.quantity : item.total,
    quantity: item.quantity,
    index,
  }));
}

export function sumLineValue(lines: readonly CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}
