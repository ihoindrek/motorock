import { describe, expect, it, vi } from "vitest";
import type { AiConfig } from "@/lib/ai/config";
import { AiEngine } from "@/lib/ai/core/engine";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import { DescriptionGenerator } from "@/lib/ai/generators/description-generator";
import { SeoGenerator } from "@/lib/ai/generators/seo-generator";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";

vi.mock("@/lib/revalidate/storefront", () => ({
  revalidateStorefront: vi.fn(),
}));

vi.mock("@/lib/monitoring/observability", () => ({
  logStorefrontEvent: vi.fn(),
}));

const sampleProduct: NormalizedProduct = {
  productId: 42,
  locale: "en",
  slug: "test-jacket",
  name: "Test Jacket",
  brand: "Rev'It",
  productType: "equipment",
  category: "jackets",
  categoryPath: ["for-men", "jackets"],
  price: 199,
  currency: "EUR",
  inStock: true,
  attributes: [],
  variations: [],
  images: [],
  existing: {},
  translations: [{ productId: 42, locale: "en", slug: "test-jacket" }],
  source: "unknown",
};

function createMockProvider(): AiProvider {
  return {
    name: "openai",
    completeJson: vi.fn(async ({ schema }) => ({
      data: schema.parse({
        shortDescription: "<p>Rev'It Test Jacket for daily riding.</p>",
        description: `<h2>Overview</h2><p>${"Detailed riding jacket copy. ".repeat(20)}</p>`,
      }),
      model: "gpt-test",
      usage: { promptTokens: 10, completionTokens: 20 },
    })),
  };
}

function createEngine(overrides?: {
  product?: NormalizedProduct | null;
  write?: () => Promise<unknown>;
}) {
  const config: AiConfig = {
    dryRun: true,
    apiSecret: "secret",
    wpWriteUrl: "https://shop.example",
    wpWriteSecret: "write-secret",
    defaultProvider: "openai",
    defaultOverwrite: "always",
    openai: { apiKey: "key", model: "gpt-test" },
    anthropic: { apiKey: null, model: "claude-test" },
  };

  const provider = createMockProvider();

  return new AiEngine({
    config,
    productRead: {
      getById: vi.fn(async () => {
        if (overrides?.product === null) {
          return null;
        }

        return overrides?.product ?? sampleProduct;
      }),
    },
    productWrite: {
      write: vi.fn(overrides?.write ?? (async () => ({ ok: true, productId: 42, locale: "en", written: {} }))),
    },
    generators: {
      description: new DescriptionGenerator(provider, "gpt-test"),
      seo: new SeoGenerator(provider, "gpt-test"),
    },
  });
}

describe("AiEngine", () => {
  it("generates description in dry-run mode", async () => {
    const engine = createEngine();
    const result = await engine.generate({
      productId: 42,
      locale: "en",
      sections: ["description"],
      options: { dryRun: true },
    });

    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.results[0]?.status).toBe("skipped");
    expect(result.revalidated).toBe(false);
  });

  it("skips existing content when overwrite=if_empty", async () => {
    const engine = createEngine({
      product: {
        ...sampleProduct,
        existing: {
          shortDescription: "<p>" + "Existing short copy. ".repeat(8) + "</p>",
          description: "<p>" + "Existing long copy. ".repeat(40) + "</p>",
        },
      },
    });

    const result = await engine.generate({
      productId: 42,
      locale: "en",
      sections: ["description"],
      options: { dryRun: true, overwrite: "if_empty" },
    });

    expect(result.results[0]?.status).toBe("skipped");
    expect(result.results[0]?.message).toContain("if_empty");
  });

  it("continues batch when one product is missing", async () => {
    const engine = createEngine({
      product: sampleProduct,
    });
    const read = engine["deps"].productRead.getById as ReturnType<typeof vi.fn>;
    read.mockImplementation(async (productId: number) => {
      if (productId === 999) {
        return null;
      }

      return sampleProduct;
    });

    const result = await engine.generateBatch({
      productIds: [999, 42],
      locales: ["en"],
      sections: ["description"],
      options: { dryRun: true },
    });

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.jobs[1]).toMatchObject({ ok: true, productId: 42 });
    expect(result.jobs[0]).toMatchObject({ ok: false, code: "product_not_found" });
  });
});
