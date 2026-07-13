import type { ProductSeoSnapshot } from "@/lib/seo/product-metadata";

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
  };
};

function schemaAvailability(inStock: boolean) {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

export function buildProductJsonLd(snapshot: ProductSeoSnapshot): ProductSchema {
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
    },
  };

  if (snapshot.description) {
    schema.description = snapshot.description;
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
