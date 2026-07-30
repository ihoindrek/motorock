import { describe, expect, it } from "vitest";
import { buildProductJsonLd } from "@/lib/seo/product-schema";

describe("buildProductJsonLd", () => {
  it("builds Product schema with offer, brand, and images", () => {
    const schema = buildProductJsonLd({
      name: "Crossfire 125",
      description: "Uus Crossfire on suunatud 125cc klassile.",
      seoTitle: "Brixton Crossfire 125 — Motorcycles",
      seoDescription: "Uus Crossfire on suunatud 125cc klassile.",
      image: "https://shop.motorock.eu/wp-content/uploads/crossfire.webp",
      images: [
        "https://shop.motorock.eu/wp-content/uploads/crossfire.webp",
        "https://shop.motorock.eu/wp-content/uploads/crossfire-side.webp",
      ],
      sku: "CF125",
      brand: "Brixton",
      price: 3999,
      inStock: true,
      slug: "brixton-crossfire-125",
      canonicalUrl: "https://motorock.eu/et/toode/brixton-crossfire-125",
    });

    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Crossfire 125",
      description: "Uus Crossfire on suunatud 125cc klassile.",
      image: [
        "https://shop.motorock.eu/wp-content/uploads/crossfire.webp",
        "https://shop.motorock.eu/wp-content/uploads/crossfire-side.webp",
      ],
      sku: "CF125",
      brand: {
        "@type": "Brand",
        name: "Brixton",
      },
      offers: {
        "@type": "Offer",
        url: "https://motorock.eu/et/toode/brixton-crossfire-125",
        priceCurrency: "EUR",
        price: "3999.00",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        hasMerchantReturnPolicy: expect.objectContaining({
          "@type": "MerchantReturnPolicy",
          merchantReturnDays: 14,
          returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        }),
      },
    });
  });

  it("adds shippingDetails when a delivery rate is provided", () => {
    const schema = buildProductJsonLd(
      {
        name: "Gloves",
        images: [],
        seoTitle: "Gloves",
        seoDescription: "Buy gloves.",
        price: 89,
        inStock: true,
        slug: "gloves",
        canonicalUrl: "https://motorock.eu/en/product/gloves",
      },
      { shipping: { cost: 3.5, country: "EE" } },
    );

    expect(schema.offers.shippingDetails).toEqual({
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "3.50",
        currency: "EUR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "EE",
      },
    });
    expect(schema.offers.hasMerchantReturnPolicy?.applicableCountry).toContain(
      "EE",
    );
  });

  it("marks out-of-stock products as unavailable", () => {
    const schema = buildProductJsonLd({
      name: "Sold out jacket",
      images: [],
      seoTitle: "Sold out jacket",
      seoDescription: "Buy Sold out jacket from €199. EU shipping available. Shop at Motorock.eu.",
      price: 199,
      inStock: false,
      slug: "sold-out-jacket",
      canonicalUrl: "https://motorock.eu/en/product/sold-out-jacket",
    });

    expect(schema.offers.availability).toBe("https://schema.org/OutOfStock");
    expect(schema.image).toBeUndefined();
    expect(schema.description).toContain("Sold out jacket");
  });
});