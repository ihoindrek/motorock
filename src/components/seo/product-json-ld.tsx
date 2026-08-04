import {
  buildFaqJsonLd,
  buildProductJsonLd,
  type ProductSchemaShipping,
} from "@/lib/seo/product-schema";
import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

type ProductJsonLdProps = {
  product: ProductSeoSnapshot;
  shipping?: ProductSchemaShipping;
  faq?: readonly { question: string; answer: string }[];
};

export function ProductJsonLd({ product, shipping, faq }: ProductJsonLdProps) {
  const schema = buildProductJsonLd(product, { shipping });
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
