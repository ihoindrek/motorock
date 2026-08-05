import type { AiConfig, AiProviderName } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import type {
  AiContentSection,
  AiGenerateRequest,
  AiOverwriteStrategy,
  BatchJobFailure,
  BatchJobResult,
  GenerateJobResult,
  GenerationContext,
  SectionPreview,
  SectionWriteResult,
} from "@/lib/ai/core/types";
import { createJobId } from "@/lib/ai/core/engine-auth";
import type { AiPublishStatus } from "@/lib/ai/domain/content-section";
import {
  hasExistingAltTextContent,
  hasExistingDescriptionContent,
  hasExistingFaqContent,
  hasExistingSeoContent,
} from "@/lib/ai/domain/normalized-product";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { AltTextGenerator } from "@/lib/ai/generators/alt-text-generator";
import type { DescriptionGenerator } from "@/lib/ai/generators/description-generator";
import type { FaqGenerator } from "@/lib/ai/generators/faq-generator";
import type { SeoGenerator } from "@/lib/ai/generators/seo-generator";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import type { ProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import type { ProductWriteRepository } from "@/lib/ai/repositories/wp-ai-write.repository";
import type { AiWritePayload } from "@/lib/ai/validation/schemas";
import { revalidateStorefront } from "@/lib/revalidate/storefront";
import { resolvePromptTemplateId } from "@/lib/ai/prompts/resolve-prompt-template";
import { logStorefrontEvent } from "@/lib/monitoring/observability";
import {
  buildMotorcycleSpecSnapshot,
  serializeMotorcycleSpecSnapshot,
} from "@/lib/shop/motorcycle-spec-snapshot";

type AiEngineDeps = {
  config: AiConfig;
  providerRegistry: ProviderRegistry;
  productRead: ProductReadRepository;
  productWrite: ProductWriteRepository;
  generators: {
    description: DescriptionGenerator;
    seo: SeoGenerator;
    faq: FaqGenerator;
    alt_text: AltTextGenerator;
  };
};

function resolveGenerationProvider(
  request: AiGenerateRequest,
  config: AiConfig,
  providerRegistry: ProviderRegistry,
) {
  const providerName = (request.options?.provider ??
    config.defaultProvider) as AiProviderName;

  if (!isProviderConfigured(providerName, config)) {
    throw new AiEngineError(
      `AI provider "${providerName}" is not configured`,
      "not_configured",
    );
  }

  return {
    provider: providerRegistry.get(providerName),
    model: resolveActiveModel(providerName, config),
    providerName,
  };
}

function resolveOverwrite(
  request: AiGenerateRequest,
  config: AiConfig,
): AiOverwriteStrategy {
  return request.options?.overwrite ?? config.defaultOverwrite;
}

function resolvePublishStatus(request: AiGenerateRequest): AiPublishStatus {
  return request.options?.publishStatus ?? "published";
}

function sectionHasExistingContent(
  section: AiContentSection,
  product: NormalizedProduct,
) {
  if (section === "description") {
    return hasExistingDescriptionContent(product.existing);
  }

  if (section === "seo") {
    return hasExistingSeoContent(product.existing);
  }

  if (section === "faq") {
    return hasExistingFaqContent(product.existing);
  }

  return hasExistingAltTextContent(product);
}

function buildMotorcycleWritePreserve(
  product: NormalizedProduct,
  request: AiGenerateRequest,
  writeSections: AiWritePayload["sections"],
): Pick<AiWritePayload, "motorcycle"> {
  if (product.productType !== "motorcycle") {
    return {};
  }

  const writesDescription = writeSections.some(
    (section) => section.section === "description",
  );
  if (!writesDescription) {
    return {};
  }

  const supplierHtml = product.existing.description?.trim();
  if (!supplierHtml) {
    return {};
  }

  const snapshot = buildMotorcycleSpecSnapshot(
    supplierHtml,
    product.existing.shortDescription ?? "",
    request.locale,
  );

  if (!snapshot) {
    return {
      motorcycle: {
        supplierDescriptionHtml: supplierHtml,
      },
    };
  }

  return {
    motorcycle: {
      supplierDescriptionHtml: supplierHtml,
      specsSnapshotJson: serializeMotorcycleSpecSnapshot(snapshot),
    },
  };
}

function promptVersionForSection(
  section: AiContentSection,
  product: NormalizedProduct,
) {
  return resolvePromptTemplateId(section, product.productType);
}

export class AiEngine {
  constructor(private readonly deps: AiEngineDeps) {}

  private async generateSection(
    section: AiContentSection,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    switch (section) {
      case "description":
        return this.deps.generators.description.generate(product, context);
      case "seo":
        return this.deps.generators.seo.generate(product, context);
      case "faq":
        return this.deps.generators.faq.generate(product, context);
      case "alt_text":
        return this.deps.generators.alt_text.generate(product, context);
    }
  }

  private buildSectionWrite(
    section: AiContentSection,
    product: NormalizedProduct,
    output: unknown,
  ): AiWritePayload["sections"][number] | null {
    if (section === "description") {
      const data = output as {
        shortDescription: string;
        description: string;
      };

      return {
        section: "description",
        shortDescription: data.shortDescription,
        description: data.description,
      };
    }

    if (section === "seo") {
      const data = output as {
        title: string;
        metaDescription: string;
        keywords: string[];
      };

      return {
        section: "seo",
        title: data.title,
        metaDescription: data.metaDescription,
        keywords: data.keywords.map((keyword) => keyword.toLowerCase()),
      };
    }

    if (section === "faq") {
      const data = output as {
        items: Array<{ question: string; answer: string }>;
      };

      return {
        section: "faq",
        items: data.items,
      };
    }

    const data = output as {
      items: Array<{ imageIndex: number; altText: string }>;
    };

    return {
      section: "alt_text",
      items: data.items.map((item) => ({
        imageIndex: item.imageIndex,
        imageId: product.images[item.imageIndex]?.id,
        altText: item.altText.trim(),
      })),
    };
  }

  private buildSectionPreview(
    section: AiContentSection,
    product: NormalizedProduct,
    output: unknown,
  ): SectionPreview | undefined {
    const writeEntry = this.buildSectionWrite(section, product, output);
    if (!writeEntry) {
      return undefined;
    }

    if (writeEntry.section === "description") {
      return {
        section: "description",
        shortDescription: writeEntry.shortDescription,
        description: writeEntry.description,
      };
    }

    if (writeEntry.section === "seo") {
      return {
        section: "seo",
        title: writeEntry.title,
        metaDescription: writeEntry.metaDescription,
        keywords: writeEntry.keywords,
      };
    }

    if (writeEntry.section === "faq") {
      return {
        section: "faq",
        items: writeEntry.items,
      };
    }

    return {
      section: "alt_text",
      items: writeEntry.items,
    };
  }

  async generate(request: AiGenerateRequest): Promise<GenerateJobResult> {
    const started = Date.now();
    const jobId = createJobId();
    const dryRun = request.options?.dryRun ?? this.deps.config.dryRun;
    const overwrite = resolveOverwrite(request, this.deps.config);
    const publishStatus = resolvePublishStatus(request);
    const shouldRevalidate =
      (request.options?.revalidate ?? !dryRun) && publishStatus === "published";

    const product = await this.deps.productRead.getById(
      request.productId,
      request.locale,
    );

    if (!product) {
      throw new AiEngineError(
        `Product ${request.productId} not found`,
        "product_not_found",
      );
    }

    const { provider, model } = resolveGenerationProvider(
      request,
      this.deps.config,
      this.deps.providerRegistry,
    );

    const results: SectionWriteResult[] = [];
    const writeSections: AiWritePayload["sections"] = [];
    let providerName = provider.name;
    let activeModel = model;

    for (const section of request.sections) {
      if (section === "alt_text" && product.images.length === 0) {
        results.push({
          section,
          locale: request.locale,
          status: "skipped",
          message: "Product has no images",
        });
        continue;
      }

      if (sectionHasExistingContent(section, product)) {
        if (overwrite === "never") {
          throw new AiEngineError(
            `${section} already exists for product ${product.productId}`,
            "overwrite_conflict",
          );
        }

        if (overwrite === "if_empty") {
          results.push({
            section,
            locale: request.locale,
            status: "skipped",
            message: "Existing content preserved (overwrite=if_empty)",
          });
          continue;
        }
      }

      const context: GenerationContext = {
        locale: request.locale,
        jobId,
        dryRun,
        promptVersion: promptVersionForSection(section, product),
        provider,
        model: activeModel,
      };

      try {
        const generation = await this.generateSection(section, product, context);
        providerName = generation.provider;
        activeModel = generation.model;

        if (!generation.validation.ok) {
          results.push({
            section,
            locale: request.locale,
            status: "validation_failed",
            validationErrors: generation.validation.errors,
            message: generation.validation.warnings.join("; ") || undefined,
          });
          continue;
        }

        const preview = this.buildSectionPreview(section, product, generation.output);
        const writeEntry = this.buildSectionWrite(section, product, generation.output);

        if (writeEntry) {
          writeSections.push(writeEntry);
        }

        results.push({
          section,
          locale: request.locale,
          status: dryRun ? "skipped" : "written",
          message: dryRun
            ? "Dry run — generated content not saved"
            : publishStatus === "draft"
              ? "Saved as draft for review"
              : "Generated successfully",
          preview,
          usage: {
            promptTokens: generation.promptTokens,
            completionTokens: generation.completionTokens,
          },
        });
      } catch (error) {
        results.push({
          section,
          locale: request.locale,
          status: "failed",
          message: error instanceof Error ? error.message : "Generation failed",
        });
      }
    }

    let revalidated = false;

    if (!dryRun && writeSections.length > 0) {
      if (!this.deps.config.wpWriteSecret) {
        throw new AiEngineError(
          "MOTOROCK_AI_WRITE_SECRET is not configured",
          "not_configured",
        );
      }

      await this.deps.productWrite.write({
        productId: product.productId,
        locale: request.locale,
        sections: writeSections,
        publishStatus,
        meta: {
          provider: providerName,
          promptVersion: writeSections
            .map((entry) => resolvePromptTemplateId(entry.section, product.productType))
            .join(","),
          model: activeModel,
          generatedAt: new Date().toISOString(),
          jobId,
        },
        ...buildMotorcycleWritePreserve(product, request, writeSections),
      });

      for (const result of results) {
        if (result.status === "written") {
          result.message =
            publishStatus === "draft"
              ? "Saved as draft for review"
              : "Saved to WooCommerce";
        }
      }

      if (shouldRevalidate) {
        revalidateStorefront();
        revalidated = true;
      }
    }

    logStorefrontEvent("ai.generate", {
      jobId,
      productId: product.productId,
      locale: request.locale,
      dryRun,
      publishStatus,
      sections: request.sections,
      revalidated,
    });

    return {
      ok:
        results.some(
          (result) => result.status === "written" || result.status === "skipped",
        ) && !results.every((result) => result.status === "validation_failed"),
      jobId,
      productId: product.productId,
      locale: request.locale,
      dryRun,
      results,
      revalidated,
      durationMs: Date.now() - started,
    };
  }

  async generateBatch(request: {
    productIds: number[];
    locales: AiGenerateRequest["locale"][];
    sections: AiContentSection[];
    options?: AiGenerateRequest["options"];
  }): Promise<BatchJobResult> {
    const started = Date.now();
    const batchId = createJobId();
    const dryRun = request.options?.dryRun ?? this.deps.config.dryRun;
    const publishStatus = request.options?.publishStatus ?? "published";
    const shouldRevalidate =
      (request.options?.revalidate ?? !dryRun) && publishStatus === "published";

    const jobs: Array<GenerateJobResult | BatchJobFailure> = [];
    let anyWritten = false;

    for (const productId of request.productIds) {
      for (const locale of request.locales) {
        try {
          const result = await this.generate({
            productId,
            locale,
            sections: request.sections,
            options: {
              ...request.options,
              revalidate: false,
            },
          });

          jobs.push(result);

          if (
            !dryRun &&
            result.results.some((entry) => entry.status === "written")
          ) {
            anyWritten = true;
          }
        } catch (error) {
          if (error instanceof AiEngineError) {
            jobs.push({
              ok: false,
              productId,
              locale,
              error: error.message,
              code: error.code,
            });
            continue;
          }

          throw error;
        }
      }
    }

    let revalidated = false;
    if (shouldRevalidate && anyWritten) {
      revalidateStorefront();
      revalidated = true;
    }

    const succeeded = jobs.filter((job) => job.ok).length;
    const failed = jobs.length - succeeded;

    logStorefrontEvent("ai.generateBatch", {
      batchId,
      total: jobs.length,
      succeeded,
      failed,
      dryRun,
      publishStatus,
      revalidated,
    });

    return {
      ok: succeeded > 0 && failed === 0,
      batchId,
      dryRun,
      total: jobs.length,
      succeeded,
      failed,
      jobs,
      revalidated,
      durationMs: Date.now() - started,
    };
  }
}
