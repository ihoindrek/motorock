import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import type { ProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { buildRelatedProductsPromptVariables } from "@/lib/commerce-ai/catalog/build-related-prompt-variables";
import {
  fetchRelatedCandidates,
  resolveCatalogProductForNormalized,
} from "@/lib/commerce-ai/catalog/fetch-related-candidates";
import {
  RelatedProductsOutputSchema,
  type RelatedProductsJobResult,
} from "@/lib/commerce-ai/catalog/schemas";
import { validateRelatedProductsOutput } from "@/lib/commerce-ai/catalog/validate-related-output";
import type { RelatedProductsWriteRepository } from "@/lib/commerce-ai/catalog/wp-related-write.repository";
import type { Locale } from "@/i18n/config";
import { revalidateStorefront } from "@/lib/revalidate/storefront";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

type RelatedProductsServiceDeps = {
  config: AiConfig;
  providerRegistry: ProviderRegistry;
  productRead: ProductReadRepository;
  relatedWrite: RelatedProductsWriteRepository;
};

export class RelatedProductsService {
  constructor(private readonly deps: RelatedProductsServiceDeps) {}

  async generate(input: {
    jobId: string;
    locale: Locale;
    productId: number;
    options?: {
      dryRun?: boolean;
      provider?: "openai" | "anthropic" | "gemini";
      revalidate?: boolean;
    };
  }): Promise<RelatedProductsJobResult> {
    const started = Date.now();
    const dryRun = input.options?.dryRun ?? this.deps.config.dryRun;
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const product = await this.deps.productRead.getById(input.productId, input.locale);
    if (!product) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        productId: input.productId,
        validationErrors: [`Product ${input.productId} not found`],
        durationMs: Date.now() - started,
      };
    }

    const catalogProduct = await resolveCatalogProductForNormalized({
      locale: input.locale,
      normalized: product,
    });

    if (!catalogProduct) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        productId: input.productId,
        validationErrors: [`Product slug ${product.slug} not found in catalog`],
        durationMs: Date.now() - started,
      };
    }

    const candidates = await fetchRelatedCandidates({
      locale: input.locale,
      current: catalogProduct,
    });

    if (candidates.length < 3) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        productId: input.productId,
        validationErrors: ["Not enough catalog candidates to recommend related products"],
        durationMs: Date.now() - started,
      };
    }

    const template = getPromptTemplate("related_products.v1");
    const variables = buildRelatedProductsPromptVariables({
      locale: input.locale,
      product,
      catalogProduct,
      candidates,
    });
    const rendered = renderPromptTemplate(template, variables);
    const provider = this.deps.providerRegistry.get(providerName);
    const model = resolveActiveModel(providerName, this.deps.config);

    const { data, model: resolvedModel } = await provider.completeJson({
      model,
      system: rendered.system,
      user: rendered.user,
      schema: RelatedProductsOutputSchema,
    });

    const allowedSlugs = new Set(candidates.map((candidate) => candidate.slug));
    const validation = validateRelatedProductsOutput(data, {
      currentSlug: product.slug,
      allowedSlugs,
    });

    if (!validation.ok) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        productId: input.productId,
        preview: data,
        validationErrors: validation.errors,
        provider: providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    if (dryRun) {
      logStorefrontEvent("commerce-ai.related_products", {
        jobId: input.jobId,
        locale: input.locale,
        productId: input.productId,
        dryRun: true,
        ok: true,
      });

      return {
        ok: true,
        dryRun: true,
        locale: input.locale,
        productId: input.productId,
        preview: data,
        relatedSlugs: validation.relatedSlugs,
        provider: providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    const writeResult = await this.deps.relatedWrite.write({
      productId: input.productId,
      locale: input.locale,
      relatedSlugs: validation.relatedSlugs,
      meta: {
        provider: providerName,
        model: resolvedModel,
        generatedAt: new Date().toISOString(),
        jobId: input.jobId,
        promptVersion: "related_products.v1",
      },
    });

    const shouldRevalidate = (input.options?.revalidate ?? true) && writeResult.ok;
    if (shouldRevalidate) {
      revalidateStorefront();
    }

    logStorefrontEvent("commerce-ai.related_products", {
      jobId: input.jobId,
      locale: input.locale,
      productId: input.productId,
      dryRun: false,
      ok: writeResult.ok,
      count: validation.relatedSlugs.length,
    });

    return {
      ok: writeResult.ok,
      dryRun: false,
      locale: input.locale,
      productId: input.productId,
      preview: data,
      relatedSlugs: writeResult.relatedSlugs,
      provider: providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }
}
