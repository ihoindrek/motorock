import type { AiConfig } from "@/lib/ai/config";
import { resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import type {
  AiContentSection,
  AiGenerateRequest,
  AiOverwriteStrategy,
  BatchJobFailure,
  BatchJobResult,
  GenerateJobResult,
  SectionPreview,
  SectionWriteResult,
} from "@/lib/ai/core/types";
import { createJobId } from "@/lib/ai/core/engine-auth";
import {
  hasExistingDescriptionContent,
  hasExistingSeoContent,
} from "@/lib/ai/domain/normalized-product";
import type { DescriptionGenerator } from "@/lib/ai/generators/description-generator";
import type { SeoGenerator } from "@/lib/ai/generators/seo-generator";
import type { ProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import type { ProductWriteRepository } from "@/lib/ai/repositories/wp-ai-write.repository";
import type { AiWritePayload } from "@/lib/ai/validation/schemas";
import { revalidateStorefront } from "@/lib/revalidate/storefront";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

type AiEngineDeps = {
  config: AiConfig;
  productRead: ProductReadRepository;
  productWrite: ProductWriteRepository;
  generators: {
    description: DescriptionGenerator;
    seo: SeoGenerator;
  };
};

function resolveOverwrite(
  request: AiGenerateRequest,
  config: AiConfig,
): AiOverwriteStrategy {
  return request.options?.overwrite ?? config.defaultOverwrite;
}

function sectionHasExistingContent(
  section: AiContentSection,
  product: Awaited<ReturnType<ProductReadRepository["getById"]>>,
) {
  if (!product) {
    return false;
  }

  if (section === "description") {
    return hasExistingDescriptionContent(product.existing);
  }

  return hasExistingSeoContent(product.existing);
}

export class AiEngine {
  constructor(private readonly deps: AiEngineDeps) {}

  async generate(request: AiGenerateRequest): Promise<GenerateJobResult> {
    const started = Date.now();
    const jobId = createJobId();
    const dryRun = request.options?.dryRun ?? this.deps.config.dryRun;
    const overwrite = resolveOverwrite(request, this.deps.config);
    const shouldRevalidate = request.options?.revalidate ?? !dryRun;

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

    const results: SectionWriteResult[] = [];
    const writeSections: AiWritePayload["sections"] = [];
    let provider: string = this.deps.config.defaultProvider;
    let model = resolveActiveModel(this.deps.config);

    for (const section of request.sections) {
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

      const context = {
        locale: request.locale,
        jobId,
        dryRun,
        promptVersion:
          section === "description"
            ? this.deps.generators.description.promptTemplateId
            : this.deps.generators.seo.promptTemplateId,
      };

      try {
        if (section === "description") {
          const generation = await this.deps.generators.description.generate(
            product,
            context,
          );
          provider = generation.provider;
          model = generation.model;

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

          const preview: SectionPreview = {
            section: "description",
            shortDescription: generation.output.shortDescription,
            description: generation.output.description,
          };

          writeSections.push({
            section: "description",
            shortDescription: preview.shortDescription,
            description: preview.description,
          });

          results.push({
            section,
            locale: request.locale,
            status: dryRun ? "skipped" : "written",
            message: dryRun
              ? "Dry run — generated content not saved"
              : "Generated successfully",
            preview,
            usage: {
              promptTokens: generation.promptTokens,
              completionTokens: generation.completionTokens,
            },
          });
        } else {
          const generation = await this.deps.generators.seo.generate(product, context);
          provider = generation.provider;
          model = generation.model;

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

          const preview: SectionPreview = {
            section: "seo",
            title: generation.output.title,
            metaDescription: generation.output.metaDescription,
            keywords: generation.output.keywords.map((keyword) => keyword.toLowerCase()),
          };

          writeSections.push({
            section: "seo",
            title: preview.title,
            metaDescription: preview.metaDescription,
            keywords: preview.keywords,
          });

          results.push({
            section,
            locale: request.locale,
            status: dryRun ? "skipped" : "written",
            message: dryRun
              ? "Dry run — generated content not saved"
              : "Generated successfully",
            preview,
            usage: {
              promptTokens: generation.promptTokens,
              completionTokens: generation.completionTokens,
            },
          });
        }
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
        meta: {
          provider,
          promptVersion: writeSections.map((entry) => entry.section).join(","),
          model,
          generatedAt: new Date().toISOString(),
          jobId,
        },
      });

      for (const result of results) {
        if (result.status === "written") {
          result.message = "Saved to WooCommerce";
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
    const shouldRevalidate = request.options?.revalidate ?? !dryRun;

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
