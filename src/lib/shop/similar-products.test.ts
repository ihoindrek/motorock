import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog-product";
import { pickSimilarProducts } from "@/lib/shop/similar-products";

function product(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name">,
): CatalogProduct {
  return {
    brand: "Test",
    price: 10,
    image: "/product.jpg",
    lifestyleImage: "/product.jpg",
    type: "equipment",
    gender: "unisex",
    category: "accessories",
    sizes: [],
    colors: [],
    inStock: true,
    isNew: false,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: "/",
    backLabel: "Back",
    ...overrides,
  };
}

describe("pickSimilarProducts", () => {
  const mirror = product({
    slug: "mirror",
    name: "Rear view mirror",
    brand: "Oxford",
    wcCategorySlugs: ["for-men", "accessories", "small-accessories"],
  });

  const catalog = [
    mirror,
    product({
      slug: "other-mirror",
      name: "Bar end mirror",
      brand: "Other",
      wcCategorySlugs: ["accessories", "small-accessories"],
    }),
    product({
      slug: "socks",
      name: "Riding socks",
      brand: "Oxford",
      category: "socks",
      wcCategorySlugs: ["for-men", "accessories", "socks"],
    }),
    product({
      slug: "gloves",
      name: "Summer gloves",
      brand: "Oxford",
      category: "gloves",
      wcCategorySlugs: ["for-men", "gloves"],
    }),
  ];

  it("only returns products from the same WooCommerce subcategory", () => {
    const related = pickSimilarProducts(mirror, catalog);

    expect(related.map((item) => item.slug)).toEqual(["other-mirror"]);
  });

  it("matches ET and EN products that share the same canonical subcategory", () => {
    const etGlove = product({
      slug: "vidar-et",
      name: "Vidar ET",
      wcCategorySlugs: ["kindad", "meestele", "naistele"],
      category: "gloves",
    });

    const enCatalog = [
      etGlove,
      product({
        slug: "en-glove",
        name: "EN glove",
        wcCategorySlugs: ["gloves"],
        category: "gloves",
      }),
      product({
        slug: "socks",
        name: "Socks",
        category: "socks",
        wcCategorySlugs: ["socks"],
      }),
    ];

    const related = pickSimilarProducts(etGlove, enCatalog);

    expect(related.map((item) => item.slug)).toEqual(["en-glove"]);
  });

  it("matches motorcycles by Woo brand subcategory, not the whole catalog", () => {
    const revolver = product({
      slug: "motron-revolver-125",
      name: "Revolver 125",
      brand: "Motron",
      type: "motorcycle",
      category: "motorcycles",
      wcCategorySlugs: ["motorcycles", "motron"],
    });

    const catalog = [
      revolver,
      product({
        slug: "motron-volt",
        name: "Volt 125",
        brand: "Motron",
        type: "motorcycle",
        category: "motorcycles",
        wcCategorySlugs: ["motorcycles", "motron"],
      }),
      product({
        slug: "malaguti-scooter",
        name: "XTM 125",
        brand: "Malaguti",
        type: "motorcycle",
        category: "motorcycles",
        wcCategorySlugs: ["motorcycles", "malaguti"],
      }),
    ];

    const related = pickSimilarProducts(revolver, catalog);

    expect(related.map((item) => item.slug)).toEqual(["motron-volt"]);
  });
});
