import type { z } from "zod";
import type {
  AiContentSection,
  GenerationContext,
  GenerationResult,
  ValidationReport,
} from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import { buildProductPromptVariables } from "@/lib/ai/prompts/build-variables";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";

export async function runStructuredGeneration<TOutput>(input: {
  provider: AiProvider;
  model: string;
  promptTemplateId: string;
  schema: z.ZodType<TOutput>;
  product: NormalizedProduct;
  context: GenerationContext;
  validate: (
    output: TOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ) => ValidationReport;
  section: AiContentSection;
}): Promise<GenerationResult<TOutput>> {
  const template = getPromptTemplate(input.promptTemplateId);
  const variables = buildProductPromptVariables(input.product);
  const rendered = renderPromptTemplate(template, variables);

  const { data, model, usage } = await input.provider.completeJson({
    model: input.model,
    system: rendered.system,
    user: rendered.user,
    schema: input.schema,
  });

  const validation = input.validate(data, input.product, input.context);

  return {
    section: input.section,
    output: data,
    validation,
    provider: input.provider.name,
    model,
    promptTokens: usage?.promptTokens,
    completionTokens: usage?.completionTokens,
  };
}
