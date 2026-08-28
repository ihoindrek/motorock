import { describe, expect, it } from "vitest";
import { fallbackSizeGuides } from "@/data/size-guides/catalog";
import { buildSizeGuideRegistry } from "@/lib/shop/size-guide-registry";
import { resolveSizeGuide } from "@/lib/shop/resolve-size-guide";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name">,
): CatalogProduct {
  return {
    brand: "Test",
    price: 10,
    image: "/product.jpg",
    lifestyleImage: "/product.jpg",
    type: "equipment",
    gender: "men",
    category: "jackets",
    sizes: ["S", "M", "L"],
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

describe("resolveSizeGuide", () => {
  const registry = buildSizeGuideRegistry(fallbackSizeGuides);

  it("returns null for one-size products", () => {
    expect(
      resolveSizeGuide(
        product({
          slug: "hat",
          name: "Hat",
          sizes: ["One size"],
        }),
        registry,
      ),
    ).toBeNull();
  });

  it("matches brand, category, and gender", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "pando-jacket",
        name: "Jacket",
        brand: "Pando Moto",
        category: "jackets",
        gender: "men",
        sizes: ["M", "L"],
      }),
      registry,
    );

    expect(guide?.id).toBe("pando-moto-jackets-men");
    expect(guide?.rows.map((row) => row.size)).toEqual(["M", "L"]);
  });

  it("falls back to unisex chart when gender-specific chart is missing", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "holy-hoodie",
        name: "Hoodie",
        brand: "Holyfreedom",
        category: "hoodies",
        gender: "men",
        sizes: ["M", "L"],
      }),
      registry,
    );

    expect(guide?.id).toBe("holyfreedom-hoodies-unisex");
  });

  it("uses product slug override when set", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "custom-pants",
        name: "Custom pants",
        brand: "Unknown Brand",
        category: "accessories",
        sizeGuideSlug: "johnny-reb-pants-men",
        sizes: ["32", "34"],
      }),
      registry,
    );

    expect(guide?.id).toBe("johnny-reb-pants-men");
    expect(guide?.rows.map((row) => row.size)).toEqual(["32", "34"]);
  });

  it("auto-matches johnny reb men vests without product override", () => {
    const remoteRegistry = buildSizeGuideRegistry([
      {
        id: "johnny-reb-vests",
        slug: "johnny-reb-vests",
        title: "Johnny Reb Vests for Men",
        brand: "Johnny Reb",
        brandSlug: "johnny-reb",
        category: "vests",
        gender: "men",
        columns: [{ key: "chest", label: "Chest" }],
        rows: [{ size: "M", measurements: { chest: 112 } }],
      },
    ]);

    const guide = resolveSizeGuide(
      product({
        slug: "johnny-reb-mens-aussie-flag-leather-vest",
        name: "Johnny Reb Men's Aussie Flag Leather Vest",
        brand: "Johnny Reb",
        category: "vests",
        gender: "men",
        sizes: ["SMALL", "Medium"],
      }),
      remoteRegistry,
    );

    expect(guide?.title).toBe("Johnny Reb Vests for Men");
  });

  it("matches size guide by brandSlug alias when WP post slug is numeric", () => {
    const remoteRegistry = buildSizeGuideRegistry([
      {
        id: "44410",
        slug: "44410",
        title: "Johnny Reb Vests for Men",
        brand: "Johnny Reb Vests",
        brandSlug: "johnny-reb-vests",
        category: "vests",
        gender: "men",
        columns: [{ key: "chest", label: "Chest" }],
        rows: [
          { size: "S", measurements: { chest: 106 } },
          { size: "M", measurements: { chest: 112 } },
        ],
      },
    ]);

    const guide = resolveSizeGuide(
      product({
        slug: "johnny-reb-mens-longreach-suede-vest",
        name: "Johnny Reb Men's Longreach Suede Vest",
        brand: "Johnny Reb",
        category: "vests",
        gender: "men",
        sizeGuideSlug: "johnny-reb-vests",
        sizes: ["SMALL", "Medium", "LARGE"],
      }),
      remoteRegistry,
    );

    expect(guide?.brandSlug).toBe("johnny-reb-vests");
    expect(guide?.rows).toHaveLength(2);
  });

  it("auto-matches johnny reb women vests from canonical brand slug", () => {
    const remoteRegistry = buildSizeGuideRegistry([
      {
        id: "johnny-reb-vests-for-women",
        slug: "johnny-reb-vests-for-women",
        title: "Johnny Reb Vests for Women",
        brand: "Johnny Reb Vests",
        brandSlug: "johnny-reb-vests-for-women",
        category: "vests",
        gender: "women",
        columns: [{ key: "chest", label: "Chest" }],
        rows: [{ size: "S", measurements: { chest: 92 } }],
      },
    ]);

    const guide = resolveSizeGuide(
      product({
        slug: "johnny-reb-womens-springbrook-leather-vest",
        name: "Johnny Reb Women's Springbrook Leather Vest",
        brand: "Johnny Reb",
        category: "vests",
        gender: "women",
        sizes: ["SMALL", "Medium"],
      }),
      remoteRegistry,
    );

    expect(guide?.title).toBe("Johnny Reb Vests for Women");
  });

  it("matches Motogirl pants automatically when brand is Motogirl", () => {
    const registry = buildSizeGuideRegistry([
      {
        id: "motogirl-jeans-pants",
        slug: "motogirl-jeans-pants",
        title: "Motogirl Jeans & Pants",
        brand: "Motogirl",
        brandSlug: "motogirl",
        category: "pants",
        gender: "women",
        columns: [{ key: "waist", label: "Waist" }],
        rows: [{ size: "UK10", measurements: { waist: 70 } }],
      },
    ]);

    const guide = resolveSizeGuide(
      product({
        slug: "vanessa-trousers",
        name: "Vanessa Trousers",
        brand: "Motogirl",
        gender: "women",
        category: "pants",
        sizes: ["UK10", "UK12"],
      }),
      registry,
    );

    expect(guide?.slug).toBe("motogirl-jeans-pants");
  });
});
