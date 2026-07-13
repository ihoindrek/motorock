import { buildProductJsonLd } from "@/lib/seo/product-schema";
import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

type ProductJsonLdProps = {
  product: ProductSeoSnapshot;
};

export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const schema = buildProductJsonLd(product);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
