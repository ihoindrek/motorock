import { unstable_cache } from "next/cache";
import {
  buildAddToCartVariationAttributes,
  buildAddToCartVariationAttributesFromCartLine,
  fetchStoreProduct,
} from "@/lib/woocommerce/store-api-product";
import {
  ADD_TO_CART,
  ALLOWED_COUNTRIES,
  CART_SHIPPING,
  UPDATE_CUSTOMER,
} from "@/lib/graphql/checkout-queries";
import { getWooGraphqlUrl } from "@/lib/storefront/url";
import {
  defaultLocationForCountry,
  sortCountryCodes,
} from "@/lib/shop/countries";
import { pickCheapestDeliveryRate } from "@/lib/shop/pick-cheapest-delivery-rate";
import {
  isShippingByAgreement,
  parseShippingRateCost,
  type ShippingRate,
} from "@/lib/shop/shipping-method";
import { sortShippingRates } from "@/lib/shop/shipping-rate-priority";
import { filterShippingRatesForCountry } from "@/lib/shop/shipping-showroom-pickup";

export type ProductShippingRateEstimate = {
  id: string;
  label: string;
  methodId: string;
  cost: number | null;
  kind: "priced" | "free" | "byAgreement";
};

export type ProductShippingEstimate = {
  country: string;
  countries: string[];
  rates: ProductShippingRateEstimate[];
  /** Cheapest non-showroom delivery summary (compat / teaser). */
  kind: "priced" | "free" | "byAgreement";
  cost: number | null;
  label: string;
  methodId: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function estimateGraphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  sessionToken?: string | null,
): Promise<{ data: TData; sessionToken: string | null }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (sessionToken) {
    headers["woocommerce-session"] = `Session ${sessionToken}`;
  }

  // POST requests bypass the Next fetch cache by default. An explicit
  // `cache: "no-store"` would additionally mark the route dynamic, which
  // must not happen — product pages are ISR and call this inside
  // unstable_cache.
  const response = await fetch(getWooGraphqlUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const nextSession =
    response.headers.get("woocommerce-session") ??
    response.headers.get("Woocommerce-Session");
  const normalized = nextSession
    ? nextSession.replace(/^Session\s+/i, "")
    : sessionToken ?? null;

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return { data: payload.data, sessionToken: normalized };
}

function flattenRates(
  packages: Array<{
    rates: ShippingRate[] | null;
  }>,
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

function mapRateEstimate(rate: ShippingRate): ProductShippingRateEstimate {
  if (isShippingByAgreement(rate)) {
    return {
      id: rate.id,
      label: rate.label,
      methodId: rate.methodId,
      cost: null,
      kind: "byAgreement",
    };
  }

  const cost = parseShippingRateCost(rate.cost);
  return {
    id: rate.id,
    label: rate.label,
    methodId: rate.methodId,
    cost,
    kind: cost === 0 ? "free" : "priced",
  };
}

async function fetchAllowedCountriesFresh() {
  const { data } = await estimateGraphqlRequest<{
    allowedCountries: string[];
  }>(ALLOWED_COUNTRIES);

  return sortCountryCodes(data.allowedCountries);
}

async function computeProductShippingEstimate(input: {
  country: string;
  productId: number;
  variationId?: number;
  size?: string;
  color?: string;
}): Promise<ProductShippingEstimate> {
  const country = input.country.toUpperCase();
  const location = defaultLocationForCountry(country);
  let session: string | null = null;

  const addInput: Record<string, unknown> = {
    productId: input.productId,
    quantity: 1,
  };

  if (input.variationId) {
    addInput.variationId = input.variationId;
  }

  const variationAttrs = buildAddToCartVariationAttributesFromCartLine({
    size: input.size,
    color: input.color,
  });
  if (variationAttrs.length > 0) {
    addInput.variation = variationAttrs;
  } else if (input.variationId) {
    const storeProduct = await fetchStoreProduct(input.productId);
    if (storeProduct) {
      const fromStore = buildAddToCartVariationAttributes(
        storeProduct,
        input,
        input.variationId,
      );
      if (fromStore.length > 0) {
        addInput.variation = fromStore;
      }
    }
  }

  const added = await estimateGraphqlRequest<
    {
      addToCart: {
        cart: { contents: { itemCount: number } | null } | null;
      } | null;
    },
    { input: Record<string, unknown> }
  >(ADD_TO_CART, { input: addInput }, session);

  session = added.sessionToken;

  if ((added.data.addToCart?.cart?.contents?.itemCount ?? 0) < 1) {
    throw new Error("Could not add product for shipping estimate");
  }

  const updated = await estimateGraphqlRequest(
    UPDATE_CUSTOMER,
    {
      input: {
        shipping: {
          country,
          postcode: location.postcode,
          city: location.city,
        },
      },
    },
    session,
  );
  session = updated.sessionToken;

  const shipping = await estimateGraphqlRequest<{
    cart: {
      availableShippingMethods: Array<{
        rates: ShippingRate[] | null;
      }>;
    };
  }>(CART_SHIPPING, undefined, session);

  const rates = sortShippingRates(
    filterShippingRatesForCountry(
      flattenRates(shipping.data.cart.availableShippingMethods),
      country,
    ),
  );

  if (rates.length === 0) {
    throw new Error("No delivery rates for country");
  }

  const countries = await fetchAllowedCountriesFresh();
  const mapped = rates.map(mapRateEstimate);
  const pick = pickCheapestDeliveryRate(rates);

  const summary = pick
    ? pick.kind === "priced"
      ? {
          kind: "priced" as const,
          cost: pick.cost,
          label: pick.rate.label,
          methodId: pick.rate.methodId,
        }
      : pick.kind === "free"
        ? {
            kind: "free" as const,
            cost: 0,
            label: pick.rate.label,
            methodId: pick.rate.methodId,
          }
        : {
            kind: "byAgreement" as const,
            cost: null,
            label: pick.rate.label,
            methodId: pick.rate.methodId,
          }
    : {
        kind: mapped[0].kind,
        cost: mapped[0].cost,
        label: mapped[0].label,
        methodId: mapped[0].methodId,
      };

  return {
    country,
    countries,
    rates: mapped,
    ...summary,
  };
}

const CACHE_SECONDS = 60 * 60;

export async function estimateProductShipping(input: {
  country: string;
  productId: number;
  variationId?: number;
  size?: string;
  color?: string;
}): Promise<ProductShippingEstimate> {
  const country = input.country.toUpperCase();
  const cached = unstable_cache(
    () =>
      computeProductShippingEstimate({
        country,
        productId: input.productId,
        variationId: input.variationId,
        size: input.size,
        color: input.color,
      }),
    [
      "shipping-estimate-v3",
      country,
      String(input.productId),
      String(input.variationId ?? 0),
      input.size ?? "",
      input.color ?? "",
    ],
    { revalidate: CACHE_SECONDS, tags: ["shipping-estimate"] },
  );

  return cached();
}
