import {
  buildProductJsonLd,
  type ProductSchemaShipping,
} from "@/lib/seo/product-schema";
import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

type ProductJsonLdProps = {
  product: ProductSeoSnapshot;
  shipping?: ProductSchemaShipping;
};

export function ProductJsonLd({ product, shipping }: ProductJsonLdProps) {
  const schema = buildProductJsonLd(product, { shipping });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
