import { describe, expect, it } from "vitest";
import {
  getMotorcycleBrandFilterNames,
  isMotorcycleBrandSlug,
  resolveBrandFromProductAttributes,
  resolveEquipmentBrand,
  resolveEquipmentBrandFromImportMeta,
  resolveEquipmentBrandFromProductName,
  resolveMotorcycleBrandFromProductName,
} from "@/lib/shop/resolve-product-brand";

describe("resolveBrandFromProductAttributes", () => {
  it("resolves motorcycle brands from pa_brand terms", () => {
    expect(
      resolveBrandFromProductAttributes(
        {
          nodes: [
            {
              name: "Brand",
              options: null,
              variation: false,
              terms: { nodes: [{ name: "Brixton", slug: "brixton" }] },
            },
          ],
        },
        { motorcycleOnly: true },
      ),
    ).toBe("Brixton");
  });

  it("prefers pa_brand over legacy category slugs for motorcycles", () => {
    expect(
      resolveBrandFromProductAttributes(
        {
          nodes: [
            {
              name: "pa_brand",
              options: ["mutt"],
              variation: false,
              terms: null,
            },
          ],
        },
        { motorcycleOnly: true },
      ),
    ).toBe("Mutt");
  });

  it("excludes motorcycle brands when equipmentOnly is set", () => {
    expect(
      resolveBrandFromProductAttributes(
        {
          nodes: [
            {
              name: "Brand",
              options: ["brixton"],
              variation: false,
              terms: null,
            },
          ],
        },
        { equipmentOnly: true },
      ),
    ).toBeUndefined();
  });

  it("ignores null brand slugs from WooCommerce", () => {
    expect(
      resolveBrandFromProductAttributes(
        {
          nodes: [
            {
              name: "Brand",
              options: [null, "  ", "holyfreedom"],
              variation: false,
              terms: { nodes: [{ name: "Holyfreedom", slug: null }] },
            },
          ],
        },
        { equipmentOnly: true },
      ),
    ).toBe("Holyfreedom");
  });
});

describe("isMotorcycleBrandSlug", () => {
  it("recognises motorcycle brand slugs", () => {
    expect(isMotorcycleBrandSlug("brixton")).toBe(true);
    expect(isMotorcycleBrandSlug("pando-moto")).toBe(false);
  });
});

describe("getMotorcycleBrandFilterNames", () => {
  it("returns the four motorcycle brands in config order", () => {
    expect(getMotorcycleBrandFilterNames()).toEqual([
      "Brixton",
      "Mutt",
      "Motron",
      "Malaguti",
    ]);
  });
});

describe("resolveMotorcycleBrandFromProductName", () => {
  it("matches known motorcycle brands from the product title", () => {
    expect(resolveMotorcycleBrandFromProductName("Brixton Crossfire 125")).toBe(
      "Brixton",
    );
    expect(resolveMotorcycleBrandFromProductName("Mutt GT-SS 125cc")).toBe(
      "Mutt",
    );
  });
});

describe("resolveEquipmentBrandFromImportMeta", () => {
  it("maps Motogirl Shopify imports to Motogirl", () => {
    expect(
      resolveEquipmentBrandFromImportMeta([
        { key: "_shopify_site_id", value: "motogirl-co-uk" },
      ]),
    ).toBe("Motogirl");
  });

  it("maps Motomad-only imports to Motogirl", () => {
    expect(
      resolveEquipmentBrandFromImportMeta([
        { key: "_import_source", value: "motomad" },
        { key: "_motomad_product_id", value: "15016" },
      ]),
    ).toBe("Motogirl");
  });

  it("does not treat Pando Shopify imports as Motogirl", () => {
    expect(
      resolveEquipmentBrandFromImportMeta([
        { key: "_import_source", value: "shopify" },
        { key: "_shopify_site_id", value: "pandomoto-com" },
        { key: "_shopify_product_id", value: "9813431320918" },
        { key: "_motomad_product_id", value: "17506" },
      ]),
    ).toBe("Pando Moto");
  });
});

describe("resolveEquipmentBrandFromProductName", () => {
  it("matches MG-prefixed Motogirl product titles", () => {
    expect(resolveEquipmentBrandFromProductName("MG Waterproof Trousers")).toBe(
      "Motogirl",
    );
  });
});

describe("resolveEquipmentBrand", () => {
  it("falls back to Shopify import metadata when pa_brand is missing", () => {
    expect(
      resolveEquipmentBrand(
        "Vanessa Trousers",
        { nodes: [] },
        [
          { key: "_import_source", value: "shopify" },
          { key: "_shopify_site_id", value: "motogirl-co-uk" },
        ],
        "VANT-BLK",
      ),
    ).toBe("Motogirl");
  });
});
