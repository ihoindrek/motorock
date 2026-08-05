import type { GenerationContext, GenerationResult } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { ContentGenerator } from "@/lib/ai/generators/content-generator";
import { runStructuredGeneration } from "@/lib/ai/generators/run-generation";
import { normalizeSeoSectionOutput } from "@/lib/ai/generators/normalize-seo-output";
import { resolvePromptTemplateId } from "@/lib/ai/prompts/resolve-prompt-template";
import {
  SeoSectionLooseSchema,
  type SeoSectionOutput,
} from "@/lib/ai/validation/schemas";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";

export class SeoGenerator implements ContentGenerator<SeoSectionOutput> {
  readonly id = "seo" as const;
  private readonly validator = new ContentQualityValidator();

  resolvePromptTemplateId(product: NormalizedProduct) {
    return resolvePromptTemplateId(this.id, product.productType);
  }

  async generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<SeoSectionOutput>> {
    const result = await runStructuredGeneration({
      provider: context.provider,
      model: context.model,
      promptTemplateId: this.resolvePromptTemplateId(product),
      schema: SeoSectionLooseSchema,
      product,
      context,
      section: this.id,
      validate: (output, currentProduct, currentContext) =>
        this.validator.validateSeo(
          normalizeSeoSectionOutput(output),
          currentProduct,
          currentContext,
        ),
    });

    return {
      ...result,
      output: normalizeSeoSectionOutput(result.output),
    };
  }

  validate(
    output: SeoSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    return this.validator.validateSeo(output, product, context);
  }
}
