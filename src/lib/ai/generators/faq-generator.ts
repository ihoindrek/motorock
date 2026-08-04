import type { GenerationContext, GenerationResult } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { ContentGenerator } from "@/lib/ai/generators/content-generator";
import { runStructuredGeneration } from "@/lib/ai/generators/run-generation";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import {
  FaqSectionSchema,
  type FaqSectionOutput,
} from "@/lib/ai/validation/schemas";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";

export class FaqGenerator implements ContentGenerator<FaqSectionOutput> {
  readonly id = "faq" as const;
  readonly promptTemplateId = "faq.v1";

  constructor(
    private readonly provider: AiProvider,
    private readonly model: string,
    private readonly validator = new ContentQualityValidator(),
  ) {}

  async generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<FaqSectionOutput>> {
    return runStructuredGeneration({
      provider: this.provider,
      model: this.model,
      promptTemplateId: this.promptTemplateId,
      schema: FaqSectionSchema,
      product,
      context,
      section: this.id,
      validate: (output, currentProduct, currentContext) =>
        this.validator.validateFaq(output, currentProduct, currentContext),
    });
  }

  validate(
    output: FaqSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    return this.validator.validateFaq(output, product, context);
  }
}
