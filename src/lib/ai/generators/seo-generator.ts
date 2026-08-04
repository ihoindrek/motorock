import type { GenerationContext, GenerationResult } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { ContentGenerator } from "@/lib/ai/generators/content-generator";
import { runStructuredGeneration } from "@/lib/ai/generators/run-generation";
import { normalizeSeoSectionOutput } from "@/lib/ai/generators/normalize-seo-output";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import {
  SeoSectionLooseSchema,
  type SeoSectionOutput,
} from "@/lib/ai/validation/schemas";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";

export class SeoGenerator implements ContentGenerator<SeoSectionOutput> {
  readonly id = "seo" as const;
  readonly promptTemplateId = "seo.v1";

  constructor(
    private readonly provider: AiProvider,
    private readonly model: string,
    private readonly validator = new ContentQualityValidator(),
  ) {}

  async generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<SeoSectionOutput>> {
    const result = await runStructuredGeneration({
      provider: this.provider,
      model: this.model,
      promptTemplateId: this.promptTemplateId,
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
