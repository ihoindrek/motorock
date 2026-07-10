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
  APPLY_COUPON,
  CART_SHIPPING,
  CHECKOUT,
  EMPTY_CART,
  PAYMENT_GATEWAYS,
  REMOVE_COUPONS,
  RESOLVE_PRODUCT_BY_ID,
  RESOLVE_PRODUCT_IDS,
  UPDATE_CUSTOMER,
  UPDATE_SHIPPING_METHOD,
} from "@/lib/graphql/checkout-queries";
import {
  fetchEnglishCheckoutProduct,
  resolveCheckoutProductIds,
  type CheckoutResolvableProduct,
} from "@/lib/graphql/resolve-checkout-product-ids";
import { isOneSizeLabel, sizesMatch } from "@/lib/shop/size-label";
import { resolveStoreVariationId } from "@/lib/woocommerce/store-api-product";
import {
  type CheckoutMetaDataInput,
  resolveMontonioCheckoutGatewayId,
} from "@/lib/checkout/montonio-checkout";

export const MONTONIO_PAYMENT_METHOD_ID = "wc_montonio_payments";
import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";
import type { ShippingRate } from "@/lib/shop/shipping-method";

type AllowedCountriesResponse = {
  allowedCountries: string[];
};

export type AppliedCoupon = {
  code: string;
  discountAmount: number;
};

export type CheckoutCartTotals = {
  subtotal: string;
  shippingTotal: string;
  total: string;
  discountTotal: string;
  needsShippingAddress: boolean;
  chosenShippingMethods: string[];
  appliedCoupons: Array<{
    code: string;
    discountAmount: string;
  }> | null;
  availableShippingMethods: Array<{
    packageDetails: string | null;
    rates: ShippingRate[] | null;
  }>;
};

type CartShippingResponse = {
  cart: CheckoutCartTotals;
};

type ResolveProductResponse = {
  product: CheckoutResolvableProduct | null;
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

async function fetchProductByDatabaseId(databaseId: number) {
  const { data } = await checkoutGraphqlRequest<
    ResolveProductResponse,
    { id: string }
  >(RESOLVE_PRODUCT_BY_ID, { id: String(databaseId) });

  return data.product;
}

async function fetchProductForLine(line: CartLine) {
  if (line.productId) {
    const product = await fetchProductByDatabaseId(line.productId);
    if (product) {
      return product;
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
  const cached = productIdCache.get(lineCacheKey(line));
  if (cached?.variationId) {
    return cached;
  }

  if (cached && !cached.variationId && !line.size && !line.color) {
    return cached;
  }

  const localized = await fetchProductForLine(line);
  if (!localized) {
    throw new Error(`Product not found: ${line.name}`);
  }

  const englishProduct = await fetchEnglishCheckoutProduct(
    localized,
    fetchProductByDatabaseId,
  );

  let resolved = resolveCheckoutProductIds(englishProduct, line, {
    isOneSizeLabel,
    sizesMatch,
  });

  if (
    englishProduct.__typename === "VariableProduct" &&
    !resolved.variationId
  ) {
    const variationId = await resolveStoreVariationId(englishProduct.databaseId, {
      size: line.size,
      color: line.color,
    });

    if (!variationId) {
      throw new Error(
        `Choose a size or color for ${line.name} before checkout.`,
      );
    }

    resolved = {
      productId: englishProduct.databaseId,
      variationId,
    };
  }

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
    ...mapCheckoutCartResponse(data.cart),
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
    discountTotal: parseCartMoney(data.updateShippingMethod.cart.discountTotal),
    appliedCoupons: parseAppliedCoupons(
      data.updateShippingMethod.cart.appliedCoupons,
    ),
    chosenRateId: data.updateShippingMethod.cart.chosenShippingMethods[0] ?? null,
    sessionToken: nextSession,
  };
}

type CouponMutationResponse = {
  applyCoupon?: { cart: CheckoutCartTotals } | null;
  removeCoupons?: { cart: CheckoutCartTotals } | null;
};

export async function applyCheckoutCoupon(
  code: string,
  sessionToken?: string | null,
) {
  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    CouponMutationResponse,
    { input: { code: string } }
  >(APPLY_COUPON, { input: { code: code.trim() } }, sessionToken);

  const cart = data.applyCoupon?.cart;
  if (!cart) {
    throw new Error("Could not apply coupon");
  }

  return {
    ...mapCheckoutCartResponse(cart),
    sessionToken: nextSession,
  };
}

export async function removeCheckoutCoupon(
  code: string,
  sessionToken?: string | null,
) {
  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    CouponMutationResponse,
    { input: { codes: string[] } }
  >(
    REMOVE_COUPONS,
    { input: { codes: [code.trim()] } },
    sessionToken,
  );

  const cart = data.removeCoupons?.cart;
  if (!cart) {
    throw new Error("Could not remove coupon");
  }

  return {
    ...mapCheckoutCartResponse(cart),
    sessionToken: nextSession,
  };
}

export function parseCartMoney(value: string | null | undefined) {
  return parseGraphqlPrice(value);
}

export function parseAppliedCoupons(
  coupons: CheckoutCartTotals["appliedCoupons"],
): AppliedCoupon[] {
  return (coupons ?? []).map((coupon) => ({
    code: coupon.code,
    discountAmount: parseCartMoney(coupon.discountAmount),
  }));
}

export function mapCheckoutCartResponse(cart: CheckoutCartTotals) {
  return {
    cart,
    rates: flattenShippingRates(cart.availableShippingMethods),
    discountTotal: parseCartMoney(cart.discountTotal),
    appliedCoupons: parseAppliedCoupons(cart.appliedCoupons),
  };
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

  return data.paymentGateways?.nodes ?? [];
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

type CheckoutAddressInput = {
  firstName: string;
  lastName: string;
  country: string;
  postcode: string;
  city: string;
  address1: string;
};

type CheckoutBillingInput = CheckoutAddressInput & {
  email: string;
  phone: string;
};

export type CheckoutCustomerDetails = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  postcode: string;
  city: string;
  address1: string;
};

export function buildCheckoutInputAddresses(customer: CheckoutCustomerDetails): {
  billing: CheckoutBillingInput;
  shipping: CheckoutAddressInput;
} {
  return {
    billing: {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      country: customer.country,
      postcode: customer.postcode,
      city: customer.city,
      address1: customer.address1,
    },
    shipping: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      country: customer.country,
      postcode: customer.postcode,
      city: customer.city,
      address1: customer.address1,
    },
  };
}

export async function submitCheckout(
  input: {
    paymentMethod?: string;
    customerNote?: string;
    metaData?: CheckoutMetaDataInput[];
    billing?: CheckoutBillingInput;
    shipping?: CheckoutAddressInput;
  },
  sessionToken?: string | null,
) {
  const selectedPaymentMethod =
    input.paymentMethod ??
    (await resolveCheckoutPaymentMethod(sessionToken));
  const paymentMethod = resolveMontonioCheckoutGatewayId(
    selectedPaymentMethod,
  );

  const { data, sessionToken: nextSession } = await checkoutGraphqlRequest<
    CheckoutResponse,
    {
      input: {
        paymentMethod: string;
        customerNote?: string;
        metaData?: CheckoutMetaDataInput[];
        billing?: CheckoutBillingInput;
        shipping?: CheckoutAddressInput;
      };
    }
  >(
    CHECKOUT,
    {
      input: {
        paymentMethod,
        ...(input.customerNote ? { customerNote: input.customerNote } : {}),
        ...(input.metaData?.length ? { metaData: input.metaData } : {}),
        ...(input.billing ? { billing: input.billing } : {}),
        ...(input.shipping ? { shipping: input.shipping } : {}),
      },
    },
    sessionToken,
  );

  const checkout = data.checkout;
  if (!checkout || checkout.result !== "success") {
    throw new Error(
      "Checkout could not be completed. Please verify delivery and payment details, then try again.",
    );
  }

  return {
    redirect: checkout.redirect,
    orderNumber: checkout.order?.orderNumber ?? null,
    orderDatabaseId: checkout.order?.databaseId ?? null,
    sessionToken: nextSession,
  };
}
