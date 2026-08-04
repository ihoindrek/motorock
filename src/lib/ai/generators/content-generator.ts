import type {
  AiContentSection,
  GenerationContext,
  GenerationResult,
  ValidationReport,
} from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

export interface ContentGenerator<TOutput> {
  readonly id: AiContentSection;
  readonly promptTemplateId: string;
  generate(
    product: NormalizedProduct,
    context: GenerationContext,
  ): Promise<GenerationResult<TOutput>>;
  validate(
    output: TOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ): ValidationReport;
}
