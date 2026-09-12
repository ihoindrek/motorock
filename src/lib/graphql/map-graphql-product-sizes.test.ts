import { describe, expect, it } from "vitest";
import {
  resolveVariableProductSizes,
  variationIdsFromProduct,
} from "@/lib/graphql/map-graphql-product";
import type { GraphQLVariableProduct } from "@/lib/graphql/types";

describe("resolveVariableProductSizes", () => {
  it("uses product attribute options instead of global taxonomy terms", () => {
    const product = {
      name: "Apex Sneakers",
      slug: "apex-sneakers",
      attributes: {
        nodes: [
          {
            name: "pa_size",
            options: ["39", "40", "41"],
            variation: true,
            terms: {
              nodes: [
                { name: "1", slug: "1" },
                { name: "2XL", slug: "2xl" },
                { name: "39", slug: "39" },
              ],
            },
          },
        ],
      },
      variations: { nodes: [] },
    } as GraphQLVariableProduct;

    expect(resolveVariableProductSizes(product)).toEqual(["39", "40", "41"]);
  });

  it("does not expose global pa_size terms when product options are empty", () => {
    const product = {
      name: "TERMINATOR HIGH CE WATERPROOF BOOTS (shoes size: 43)",
      slug: "terminator-high-ce-waterproof-boots-shoes-size-43",
      attributes: {
        nodes: [
          {
            name: "pa_size",
            options: [],
            variation: true,
            terms: {
              nodes: [
                { name: "1", slug: "1" },
                { name: "2XL", slug: "2xl" },
                { name: "10 (M)", slug: "10-m" },
              ],
            },
          },
        ],
      },
      variations: {
        nodes: [
          {
            databaseId: 1,
            sku: null,
            name: null,
            price: null,
            regularPrice: null,
            stockStatus: null,
            attributes: {
              nodes: [{ name: "pa_size", value: "" }],
            },
          },
        ],
      },
    } as GraphQLVariableProduct;

    expect(resolveVariableProductSizes(product)).toEqual(["43"]);
  });

  it("reads UK sizes from SKUs when pa_size stores color codes", () => {
    const product = {
      name: "Fiona Black Leather Trousers",
      slug: "fiona-black-leather-trousers",
      attributes: {
        nodes: [
          {
            name: "pa_size",
            options: ["blk", "red", "yel"],
            variation: true,
            terms: {
              nodes: [
                { name: "BLK", slug: "blk" },
                { name: "Red", slug: "red" },
                { name: "YEL", slug: "yel" },
              ],
            },
          },
          {
            name: "pa_leg-length",
            options: ["petite", "regular", "tall"],
            variation: true,
            terms: {
              nodes: [
                { name: "Petite", slug: "petite" },
                { name: "Regular", slug: "regular" },
                { name: "Tall", slug: "tall" },
              ],
            },
          },
        ],
      },
      variations: {
        nodes: [
          {
            databaseId: 1,
            sku: "FIO-TRO-BLK-6P",
            attributes: {
              nodes: [
                { name: "pa_size", value: "blk" },
                { name: "pa_leg-length", value: "petite" },
              ],
            },
          },
          {
            databaseId: 2,
            sku: "FIO-TRO-BLK-8R",
            attributes: {
              nodes: [
                { name: "pa_size", value: "blk" },
                { name: "pa_leg-length", value: "regular" },
              ],
            },
          },
        ],
      },
    } as GraphQLVariableProduct;

    expect(resolveVariableProductSizes(product)).toEqual(["6", "8"]);
  });
});

describe("variationIdsFromProduct", () => {
  it("indexes leg-length combinations without color for single-color trousers", () => {
    const product = {
      name: "Julia Jeggings (Black)",
      slug: "julia-jeggings-black",
      attributes: {
        nodes: [
          {
            name: "pa_size",
            options: ["eu34-uk6"],
            variation: true,
            terms: {
              nodes: [{ name: "EU34 (UK6)", slug: "eu34-uk6" }],
            },
          },
          {
            name: "pa_leg-length",
            options: ["petite", "regular"],
            variation: true,
            terms: {
              nodes: [
                { name: "Petite", slug: "petite" },
                { name: "Regular", slug: "regular" },
              ],
            },
          },
          {
            name: "pa_color",
            options: ["black"],
            variation: true,
            terms: { nodes: [{ name: "Black", slug: "black" }] },
          },
        ],
      },
      variations: {
        nodes: [
          {
            databaseId: 23101,
            sku: "JUL-BLK-34P",
            attributes: {
              nodes: [
                { name: "pa_size", value: "eu34-uk6" },
                { name: "pa_leg-length", value: "petite" },
                { name: "pa_color", value: "black" },
              ],
            },
          },
          {
            databaseId: 23100,
            sku: "JUL-BLK-34R",
            attributes: {
              nodes: [
                { name: "pa_size", value: "eu34-uk6" },
                { name: "pa_leg-length", value: "regular" },
                { name: "pa_color", value: "black" },
              ],
            },
          },
        ],
      },
    } as GraphQLVariableProduct;

    expect(variationIdsFromProduct(product)).toMatchObject({
      "EU34 (UK6)|black|regular": 23100,
      "EU34 (UK6)||regular": 23100,
      "EU34 (UK6)|black|petite": 23101,
      "EU34 (UK6)||petite": 23101,
    });
    expect(variationIdsFromProduct(product)?.["EU34 (UK6)"]).toBeUndefined();
  });
});
