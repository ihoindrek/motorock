import type { GenerationContext, GenerationResult } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { ContentGenerator } from "@/lib/ai/generators/content-generator";
import { runStructuredGeneration } from "@/lib/ai/generators/run-generation";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import { resolvePromptTemplateId } from "@/lib/ai/prompts/resolve-prompt-template";
import {
  FaqSectionSchema,
  type FaqSectionOutput,
} from "@/lib/ai/validation/schemas";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";
import { filterForbiddenFaqItems } from "@/lib/ai/validation/faq-forbidden-topics";

export class FaqGenerator implements ContentGenerator<FaqSectionOutput> {
  readonly id = "faq" as const;

  constructor(
    private readonly provider: AiProvider,
    private readonly model: string,
    private readonly validator = new ContentQualityValidator(),
  ) {}

  resolvePromptTemplateId(product: NormalizedProduct) {
    return resolvePromptTemplateId(this.id, product.productType);
  }

  async generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<FaqSectionOutput>> {
    const result = await runStructuredGeneration({
      provider: this.provider,
      model: this.model,
      promptTemplateId: this.resolvePromptTemplateId(product),
      schema: FaqSectionSchema,
      product,
      context,
      section: this.id,
      validate: (output, currentProduct, currentContext) =>
        this.validateFaqOutput(output, currentProduct, currentContext),
    });

    if (!result.validation.ok) {
      return result;
    }

    const { kept } = filterForbiddenFaqItems(result.output.items);
    return {
      ...result,
      output: { items: kept },
    };
  }

  validate(
    output: FaqSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    return this.validateFaqOutput(output, product, context);
  }

  private validateFaqOutput(
    output: FaqSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) {
    const { kept, removed } = filterForbiddenFaqItems(output.items);
    const sanitized: FaqSectionOutput = { items: kept };
    const validation = this.validator.validateFaq(sanitized, product, context);

    if (removed.length > 0) {
      validation.warnings.push(
        `Removed ${removed.length} FAQ item(s) about stock/showroom availability`,
      );
    }

    if (kept.length < 3) {
      return {
        ok: false,
        errors: [
          ...validation.errors,
          "Too few FAQ items after removing stock/showroom topics (need at least 3)",
        ],
        warnings: validation.warnings,
      };
    }

    return validation;
  }
}
