import { describe, expect, it } from "vitest";
import {
  getMotorcycleBrandFilterNames,
  isMotorcycleBrandSlug,
  resolveBrandFromProductAttributes,
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
