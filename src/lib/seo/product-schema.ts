import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

/** Cheapest delivery rate for schema.org OfferShippingDetails. */
export type ProductSchemaShipping = {
  cost: number;
  /** ISO 3166-1 alpha-2, e.g. "EE". */
  country: string;
};

type OfferShippingDetails = {
  "@type": "OfferShippingDetails";
  shippingRate: {
    "@type": "MonetaryAmount";
    value: string;
    currency: "EUR";
  };
  shippingDestination: {
    "@type": "DefinedRegion";
    addressCountry: string;
  };
};

type MerchantReturnPolicy = {
  "@type": "MerchantReturnPolicy";
  applicableCountry: string[];
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow";
  merchantReturnDays: number;
  returnMethod: "https://schema.org/ReturnByMail";
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility";
};

type ProductSchema = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: "EUR";
    price: string;
    availability: string;
    itemCondition: "https://schema.org/NewCondition";
    shippingDetails?: OfferShippingDetails;
    hasMerchantReturnPolicy?: MerchantReturnPolicy;
  };
};

/** EU countries the store ships to; used for the consumer-rights return policy. */
const RETURN_POLICY_COUNTRIES = [
  "EE", "LV", "LT", "FI", "SE", "DK", "DE", "PL", "NL", "BE",
  "AT", "FR", "IE", "IT", "ES", "PT", "CZ", "SK", "SI", "HR",
  "HU", "RO", "BG", "GR", "LU", "MT", "CY",
];

function schemaAvailability(inStock: boolean) {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

function buildShippingDetails(
  shipping: ProductSchemaShipping,
): OfferShippingDetails {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: shipping.cost.toFixed(2),
      currency: "EUR",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: shipping.country,
    },
  };
}

function buildReturnPolicy(): MerchantReturnPolicy {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: RETURN_POLICY_COUNTRIES,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

export function buildFaqJsonLd(items: readonly { question: string; answer: string }[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildProductJsonLd(
  snapshot: ProductSeoSnapshot,
  options?: { shipping?: ProductSchemaShipping },
): ProductSchema {
  const schema: ProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: snapshot.name,
    offers: {
      "@type": "Offer",
      url: snapshot.canonicalUrl,
      priceCurrency: "EUR",
      price: snapshot.price.toFixed(2),
      availability: schemaAvailability(snapshot.inStock),
      itemCondition: "https://schema.org/NewCondition",
      hasMerchantReturnPolicy: buildReturnPolicy(),
      ...(options?.shipping
        ? { shippingDetails: buildShippingDetails(options.shipping) }
        : {}),
    },
  };

  if (snapshot.seoDescription || snapshot.description) {
    schema.description = snapshot.seoDescription ?? snapshot.description;
  }

  if (snapshot.images.length > 0) {
    schema.image = snapshot.images;
  }

  if (snapshot.sku) {
    schema.sku = snapshot.sku;
  }

  if (snapshot.brand) {
    schema.brand = {
      "@type": "Brand",
      name: snapshot.brand,
    };
  }

  return schema;
}
