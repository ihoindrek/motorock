import {
  buildFaqJsonLd,
  buildProductJsonLd,
  type ProductSchemaShipping,
} from "@/lib/seo/product-schema";
import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

/** Fallback for Merchant/rich results when page-specific rates are not passed. */
const DEFAULT_SCHEMA_SHIPPING: ProductSchemaShipping = {
  cost: 2.99,
  country: "EE",
};

type ProductJsonLdProps = {
  product: ProductSeoSnapshot;
  shipping?: ProductSchemaShipping;
  faq?: readonly { question: string; answer: string }[];
};

export function ProductJsonLd({ product, shipping, faq }: ProductJsonLdProps) {
  const schema = buildProductJsonLd(product, {
    shipping: shipping ?? DEFAULT_SCHEMA_SHIPPING,
  });
  const faqSchema = faq ? buildFaqJsonLd(faq) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      ) : null}
    </>
  );
}
