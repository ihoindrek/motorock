import type { CartLine } from "@/context/cart-context";
import {
  checkoutGraphqlRequest,
  readWooSessionToken,
} from "@/lib/graphql/checkout-client";
import {
  ADD_TO_CART,
  ALLOWED_COUNTRIES,
  CART_SHIPPING,
  EMPTY_CART,
  RESOLVE_PRODUCT_IDS,
  UPDATE_CUSTOMER,
  UPDATE_SHIPPING_METHOD,
} from "@/lib/graphql/checkout-queries";
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

function formatSizeLabel(value: string) {
  return value
    .replace(/^w(\d+)-l(\d+)$/i, "W$1/L$2")
    .replace(/^(\d+)$/, (_, digits: string) => digits.toUpperCase());
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

export async function fetchAllowedCountries() {
  const { data } = await checkoutGraphqlRequest<AllowedCountriesResponse>(
    ALLOWED_COUNTRIES,
  );
  return data.allowedCountries;
}

export async function resolveCartLineIds(line: CartLine): Promise<{
  productId: number;
  variationId?: number;
}> {
  if (line.productId) {
    return {
      productId: line.productId,
      variationId: line.variationId,
    };
  }

  const cached = productIdCache.get(lineCacheKey(line));
  if (cached) {
    return cached;
  }

  const { data } = await checkoutGraphqlRequest<
    ResolveProductResponse,
    { slug: string }
  >(RESOLVE_PRODUCT_IDS, { slug: line.slug });

  const product = data.product;
  if (!product) {
    throw new Error(`Product not found: ${line.name}`);
  }

  if (product.__typename === "SimpleProduct") {
    const resolved = { productId: product.databaseId };
    productIdCache.set(lineCacheKey(line), resolved);
    return resolved;
  }

  const variation = (product.variations?.nodes ?? []).find((node) => {
    const attributes = node.attributes?.nodes ?? [];
    const size = attributes.find((attribute) => isSizeAttribute(attribute.name));
    const color = attributes.find((attribute) => isColorAttribute(attribute.name));

    if (line.size && size) {
      return formatSizeLabel(size.value) === line.size;
    }

    if (line.color && color) {
      return color.value === line.color;
    }

    return false;
  });

  const resolved = {
    productId: product.databaseId,
    variationId: variation?.databaseId,
  };
  productIdCache.set(lineCacheKey(line), resolved);
  return resolved;
}

export async function syncLocalCartToWoo(lines: CartLine[]) {
  let session = readWooSessionToken();

  try {
    await checkoutGraphqlRequest(EMPTY_CART, undefined, session);
  } catch {
    // Cart may already be empty.
  }

  for (const line of lines) {
    const { productId, variationId } = await resolveCartLineIds(line);
    const input: Record<string, unknown> = {
      productId,
      quantity: line.quantity,
    };

    if (variationId) {
      input.variationId = variationId;
    }

    const result = await checkoutGraphqlRequest(
      ADD_TO_CART,
      { input },
      session,
    );
    session = result.sessionToken;
  }

  return session;
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
    sessionToken: nextSession,
  };
}

export function parseCartMoney(value: string | null | undefined) {
  return parseGraphqlPrice(value);
}
