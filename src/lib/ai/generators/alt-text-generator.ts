import type { GenerationContext, GenerationResult } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { ContentGenerator } from "@/lib/ai/generators/content-generator";
import { runStructuredGeneration } from "@/lib/ai/generators/run-generation";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import {
  AltTextSectionSchema,
  type AltTextSectionOutput,
} from "@/lib/ai/validation/schemas";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";

export class AltTextGenerator implements ContentGenerator<AltTextSectionOutput> {
  readonly id = "alt_text" as const;
  readonly promptTemplateId = "alt_text.v1";

  constructor(
    private readonly provider: AiProvider,
    private readonly model: string,
    private readonly validator = new ContentQualityValidator(),
  ) {}

  async generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<AltTextSectionOutput>> {
    return runStructuredGeneration({
      provider: this.provider,
      model: this.model,
      promptTemplateId: this.promptTemplateId,
      schema: AltTextSectionSchema,
      product,
      context,
      section: this.id,
      validate: (output, currentProduct, currentContext) =>
        this.validator.validateAltText(output, currentProduct, currentContext),
    });
  }

  validate(
    output: AltTextSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    return this.validator.validateAltText(output, product, context);
  }
}
