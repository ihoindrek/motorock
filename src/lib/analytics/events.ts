import type { CartLine } from "@/context/cart-context";
import type { OrderSummary } from "@/app/api/order/summary/route";
import type { CatalogProduct } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import {
  hasTrackedPurchase,
  markPurchaseTracked,
  pushDataLayerEvent,
  pushEcommerceEvent,
} from "@/lib/analytics/data-layer";
import {
  mapCartLineToGa4Item,
  mapCartLinesToGa4Items,
  mapCatalogProductToGa4Item,
  mapOrderSummaryItemsToGa4Items,
  sumLineValue,
} from "@/lib/analytics/items";

const DEFAULT_CURRENCY = "EUR";

export function trackViewItem(
  product: CatalogProduct,
  options?: { variationId?: number },
) {
  const item = mapCatalogProductToGa4Item(
    product,
    undefined,
    options?.variationId,
  );

  pushEcommerceEvent("view_item", {
    currency: DEFAULT_CURRENCY,
    value: product.price,
    items: [item],
  });
}

export function trackViewMotorcycleProduct(product: MotorcycleProduct) {
  const item = {
    item_id:
      product.databaseId != null
        ? String(product.databaseId)
        : product.sync.sku || product.slug,
    item_name: product.sync.name,
    item_brand: product.sync.brand,
    item_category: "Motorcycles",
    price: product.sync.price,
    quantity: 1,
  };

  pushEcommerceEvent("view_item", {
    currency: DEFAULT_CURRENCY,
    value: product.sync.price,
    items: [item],
  });
}

export function trackViewItemList(input: {
  listId: string;
  listName: string;
  products: readonly CatalogProduct[];
}) {
  if (input.products.length === 0) {
    return;
  }

  const items = input.products.map((product, index) =>
    mapCatalogProductToGa4Item(product, index),
  );

  pushEcommerceEvent("view_item_list", {
    currency: DEFAULT_CURRENCY,
    item_list_id: input.listId,
    item_list_name: input.listName,
    items,
  });
}

export function trackAddToCart(
  line: Omit<CartLine, "quantity"> & { quantity?: number },
) {
  const quantity = line.quantity ?? 1;
  const item = mapCartLineToGa4Item({ ...line, quantity });

  pushEcommerceEvent("add_to_cart", {
    currency: DEFAULT_CURRENCY,
    value: line.price * quantity,
    items: [item],
  });
}

export function trackRemoveFromCart(line: CartLine) {
  pushEcommerceEvent("remove_from_cart", {
    currency: DEFAULT_CURRENCY,
    value: line.price * line.quantity,
    items: [mapCartLineToGa4Item(line)],
  });
}

export function trackViewCart(lines: readonly CartLine[]) {
  if (lines.length === 0) {
    return;
  }

  pushEcommerceEvent("view_cart", {
    currency: DEFAULT_CURRENCY,
    value: sumLineValue(lines),
    items: mapCartLinesToGa4Items(lines),
  });
}

export function trackBeginCheckout(
  lines: readonly CartLine[],
  value?: number,
) {
  if (lines.length === 0) {
    return;
  }

  pushEcommerceEvent("begin_checkout", {
    currency: DEFAULT_CURRENCY,
    value: value ?? sumLineValue(lines),
    items: mapCartLinesToGa4Items(lines),
  });
}

export function trackAddShippingInfo(input: {
  lines: readonly CartLine[];
  shippingTier: string;
  value?: number;
}) {
  pushEcommerceEvent("add_shipping_info", {
    currency: DEFAULT_CURRENCY,
    value: input.value ?? sumLineValue(input.lines),
    shipping_tier: input.shippingTier,
    items: mapCartLinesToGa4Items(input.lines),
  });
}

export function trackAddPaymentInfo(input: {
  lines: readonly CartLine[];
  paymentType: string;
  value?: number;
}) {
  pushEcommerceEvent("add_payment_info", {
    currency: DEFAULT_CURRENCY,
    value: input.value ?? sumLineValue(input.lines),
    payment_type: input.paymentType,
    items: mapCartLinesToGa4Items(input.lines),
  });
}

export function trackSearch(searchTerm: string) {
  const term = searchTerm.trim();
  if (!term) {
    return;
  }

  pushDataLayerEvent("search", {
    search_term: term,
  });
}

function isPurchaseTrackableStatus(status: string) {
  const normalized = status.toLowerCase();
  return !["pending", "failed", "cancelled", "refunded", "trash"].includes(
    normalized,
  );
}

export function trackPurchase(summary: OrderSummary) {
  if (!isPurchaseTrackableStatus(summary.status)) {
    return;
  }

  if (hasTrackedPurchase(summary.orderNumber)) {
    return;
  }

  pushEcommerceEvent("purchase", {
    transaction_id: summary.orderNumber,
    value: summary.total,
    currency: summary.currency || DEFAULT_CURRENCY,
    items: mapOrderSummaryItemsToGa4Items(summary.items),
  });

  markPurchaseTracked(summary.orderNumber);
}
