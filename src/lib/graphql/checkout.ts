import type { CartLine } from "@/context/cart-context";
import {
  checkoutGraphqlRequest,
  readSyncedCartLinesKey,
  readWooSessionToken,
  writeSyncedCartLinesKey,
} from "@/lib/graphql/checkout-client";
import {
  ADD_TO_CART,
  ALLOWED_COUNTRIES,
  CART_SHIPPING,
  CHECKOUT,
  EMPTY_CART,
  PAYMENT_GATEWAYS,
  RESOLVE_PRODUCT_BY_ID,
  RESOLVE_PRODUCT_IDS,
  UPDATE_CUSTOMER,
  UPDATE_SHIPPING_METHOD,
} from "@/lib/graphql/checkout-queries";
import { sizesMatch } from "@/lib/shop/size-label";

export const MONTONIO_PAYMENT_METHOD_ID = "wc_montonio_payments";
import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";
import type { ShippingRate } from "@/lib/shop/shipping-method";

type AllowedCountriesResponse = {
  allowedCountries: string[];
};

type CartShippingResponse = {
  cart: {
    subtotal: string;
    shippingTotal: string;
    total: string;
    needsShippingAddress: boolean;
    chosenShippingMethods: string[];
    availableShippingMethods: Array<{
      packageDetails: string | null;
      rates: ShippingRate[] | null;
    }>;
  };
};

type ResolveProductResponse = {
  product: {
    databaseId: number;
    __typename: "SimpleProduct" | "VariableProduct";
    variations?: {
      nodes: Array<{
        databaseId: number;
        attributes?: {
          nodes: Array<{ name: string; value: string }>;
        } | null;
      }>;
    } | null;
  } | null;
};

type UpdateCustomerResponse = {
  updateCustomer: {
    customer: {
      shipping: {
        country: string | null;
        postcode: string | null;
        city: string | null;
        address1: string | null;
      } | null;
    } | null;
  };
};

type UpdateShippingMethodResponse = {
  updateShippingMethod: {
    cart: CartShippingResponse["cart"];
  };
};

const productIdCache = new Map<string, { productId: number; variationId?: number }>();

function normalizeAttributeName(name: string) {
  return name.toLowerCase().replace(/^pa_/, "");
}

function isSizeAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  return normalized === "size" || normalized === "suurus" || normalized.includes("size");
}

function isColorAttribute(name: string) {
  const normalized = normalizeAttributeName(name);
  return (
    normalized === "color" ||
    normalized === "colour" ||
    normalized === "värv" ||
    normalized === "finish"
  );
}

function lineCacheKey(line: CartLine) {
  return `${line.slug}:${line.size ?? ""}:${line.color ?? ""}`;
}

export function flattenShippingRates(
  packages: CartShippingResponse["cart"]["availableShippingMethods"],
) {
  const rates: ShippingRate[] = [];

  for (const shippingPackage of packages) {
    for (const rate of shippingPackage.rates ?? []) {
      if (!rates.some((existing) => existing.id === rate.id)) {
        rates.push(rate);
      }
    }
  }

  return rates;
}

const ALLOWED_COUNTRIES_TTL_MS = 60 * 60 * 1000;
let allowedCountriesCache: { fetchedAt: number; countries: string[] } | null =
  null;

export async function fetchAllowedCountries() {
  if (
    allowedCountriesCache &&
    Date.now() - allowedCountriesCache.fetchedAt < ALLOWED_COUNTRIES_TTL_MS
  ) {
    return allowedCountriesCache.countries;
  }

  const { data } = await checkoutGraphqlRequest<AllowedCountriesResponse>(
    ALLOWED_COUNTRIES,
  );
  allowedCountriesCache = {
    fetchedAt: Date.now(),
    countries: data.allowedCountries,
  };
  return data.allowedCountries;
}

type AddToCartResponse = {
  addToCart: {
    cart: {
      isEmpty: boolean;
      contents: {
        itemCount: number;
      } | null;
    } | null;
  } | null;
};

function findVariationForLine(
  product: NonNullable<ResolveProductResponse["product"]>,
  line: CartLine,
) {
  if (product.__typename === "SimpleProduct") {
    return undefined;
  }

  return (product.variations?.nodes ?? []).find((node) => {
    const attributes = node.attributes?.nodes ?? [];
    const size = attributes.find((attribute) => isSizeAttribute(attribute.name));
    const color = attributes.find((attribute) => isColorAttribute(attribute.name));

    const sizeMatches =
      line.size &&
      line.size !== "One size" &&
      size &&
      sizesMatch(size.value, line.size);
    const colorMatches =
      line.color &&
      color &&
      (color.value === line.color ||
        color.value.toLowerCase() === line.color.toLowerCase());

    if (sizeMatches && colorMatches) {
      return true;
    }

    if (sizeMatches && !line.color) {
      return true;
    }

    if (colorMatches && (!line.size || line.size === "One size")) {
      return true;
    }

    return false;
  });
}

async function fetchProductForLine(line: CartLine) {
  if (line.productId) {
    const { data } = await checkoutGraphqlRequest<
      ResolveProductResponse,
      { id: string }
    >(RESOLVE_PRODUCT_BY_ID, { id: String(line.productId) });

    if (data.product) {
      return data.product;
    }
  }

  const { data } = await checkoutGraphqlRequest<
    ResolveProductResponse,
    { slug: string }
  >(RESOLVE_PRODUCT_IDS, { slug: line.slug });

  return data.product;
}

export async function resolveCartLineIds(line: CartLine): Promise<{
  productId: number;
  variationId?: number;
}> {
  if (line.productId && line.variationId) {
    return {
      productId: line.productId,
      variationId: line.variationId,
    };
  }

  const cached = productIdCache.get(lineCacheKey(line));
  if (cached?.variationId || (cached && !line.size && !line.color)) {
    return cached;
  }

  const product = await fetchProductForLine(line);
  if (!product) {
    throw new Error(`Product not found: ${line.name}`);
  }

  if (product.__typename === "SimpleProduct") {
    const resolved = { productId: product.databaseId };
    productIdCache.set(lineCacheKey(line), resolved);
    return resolved;
  }

  const variation = findVariationForLine(product, line);
  if (!variation?.databaseId) {
    throw new Error(
      `Choose a size or color for ${line.name} before checkout.`,
    );
  }

  const resolved = {
    productId: product.databaseId,
    variationId: variation.databaseId,
  };
  productIdCache.set(lineCacheKey(line), resolved);
  return resolved;
}

export async function syncLocalCartToWoo(
  lines: CartLine[],
  options?: { linesKey?: string },
) {
  const session = readWooSessionToken();
  const linesKey = options?.linesKey;

  if (
    linesKey &&
    session &&
    readSyncedCartLinesKey() === linesKey
  ) {
    return session;
  }

  let activeSession = session;

  try {
    await checkoutGraphqlRequest(EMPTY_CART, undefined, activeSession);
  } catch {
    // Cart may already be empty.
  }

  const resolvedLines = await Promise.all(
    lines.map((line) => resolveCartLineIds(line)),
  );

  let itemCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const { productId, variationId } = resolvedLines[index];
    const input: Record<string, unknown> = {
      productId,
      quantity: line.quantity,
    };

    if (variationId) {
      input.variationId = variationId;
    }

    const { data, sessionToken } = await checkoutGraphqlRequest<
      AddToCartResponse,
      { input: Record<string, unknown> }
    >(ADD_TO_CART, { input }, activeSession);

    activeSession = sessionToken;
    itemCount = data.addToCart?.cart?.contents?.itemCount ?? 0;
  }

  if (itemCount === 0 && lines.length > 0) {
    throw new Error(
      "Could not add items to checkout cart. Remove items and add them again from the product page.",
    );
  }

  if (linesKey) {
    writeSyncedCartLinesKey(linesKey);
  }

  return activeSession;
}

export async function updateCheckoutCustomerShipping(
  shipping: {
    country: string;
    postcode?: string;
    city?: string;
    address1?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  },
  sessionToken?: string | null,
) {
  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    UpdateCustomerResponse,
    {
      input: {
        billing?: Record<string, string>;
        shipping: Record<string, string>;
      };
    }
  >(
    UPDATE_CUSTOMER,
    {
      input: {
        ...(shipping.email || shipping.firstName || shipping.lastName || shipping.phone
          ? {
              billing: {
                ...(shipping.email ? { email: shipping.email } : {}),
                ...(shipping.firstName ? { firstName: shipping.firstName } : {}),
                ...(shipping.lastName ? { lastName: shipping.lastName } : {}),
                ...(shipping.phone ? { phone: shipping.phone } : {}),
                country: shipping.country,
                ...(shipping.postcode ? { postcode: shipping.postcode } : {}),
                ...(shipping.city ? { city: shipping.city } : {}),
                ...(shipping.address1 ? { address1: shipping.address1 } : {}),
              },
            }
          : {}),
        shipping: {
          country: shipping.country,
          ...(shipping.postcode ? { postcode: shipping.postcode } : {}),
          ...(shipping.city ? { city: shipping.city } : {}),
          ...(shipping.address1 ? { address1: shipping.address1 } : {}),
          ...(shipping.firstName ? { firstName: shipping.firstName } : {}),
          ...(shipping.lastName ? { lastName: shipping.lastName } : {}),
        },
      },
    },
    sessionToken,
  );

  return { data, sessionToken: nextSession };
}

export async function fetchCartShipping(sessionToken?: string | null) {
  const { data, sessionToken: nextSession } =
    await checkoutGraphqlRequest<CartShippingResponse>(
      CART_SHIPPING,
      undefined,
      sessionToken,
    );

  return {
    cart: data.cart,
    rates: flattenShippingRates(data.cart.availableShippingMethods),
    sessionToken: nextSession,
  };
}

export async function selectShippingRate(
  rateId: string,
  sessionToken?: string | null,
) {
  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    UpdateShippingMethodResponse,
    { input: { shippingMethods: string[] } }
  >(
    UPDATE_SHIPPING_METHOD,
    { input: { shippingMethods: [rateId] } },
    sessionToken,
  );

  return {
    cart: data.updateShippingMethod.cart,
    rates: flattenShippingRates(
      data.updateShippingMethod.cart.availableShippingMethods,
    ),
    chosenRateId: data.updateShippingMethod.cart.chosenShippingMethods[0] ?? null,
    sessionToken: nextSession,
  };
}

export function parseCartMoney(value: string | null | undefined) {
  return parseGraphqlPrice(value);
}

type PaymentGatewaysResponse = {
  paymentGateways: {
    nodes: PaymentGateway[];
  };
};

export type PaymentGateway = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
};

type CheckoutResponse = {
  checkout: {
    result: string;
    redirect: string | null;
    order: {
      databaseId: number | null;
      orderNumber: string | null;
    } | null;
  } | null;
};

export async function fetchPaymentGateways(sessionToken?: string | null) {
  const { data } = await checkoutGraphqlRequest<PaymentGatewaysResponse>(
    PAYMENT_GATEWAYS,
    undefined,
    sessionToken,
  );

  return data.paymentGateways.nodes;
}

export async function resolveCheckoutPaymentMethod(
  sessionToken?: string | null,
) {
  const gateways = await fetchPaymentGateways(sessionToken);
  const montonio = gateways.find(
    (gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID,
  );

  return montonio?.id ?? gateways[0]?.id ?? MONTONIO_PAYMENT_METHOD_ID;
}

export async function submitCheckout(
  input: {
    paymentMethod?: string;
    customerNote?: string;
  },
  sessionToken?: string | null,
) {
  const paymentMethod =
    input.paymentMethod ??
    (await resolveCheckoutPaymentMethod(sessionToken));

  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    CheckoutResponse,
    {
      input: {
        paymentMethod: string;
        customerNote?: string;
      };
    }
  >(
    CHECKOUT,
    {
      input: {
        paymentMethod,
        ...(input.customerNote ? { customerNote: input.customerNote } : {}),
      },
    },
    sessionToken,
  );

  const checkout = data.checkout;
  if (!checkout || checkout.result !== "success") {
    throw new Error("Checkout could not be completed. Please try again.");
  }

  return {
    redirect: checkout.redirect,
    orderNumber: checkout.order?.orderNumber ?? null,
    sessionToken: nextSession,
  };
}
