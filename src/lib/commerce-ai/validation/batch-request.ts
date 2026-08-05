import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { isAiContentSection } from "@/lib/ai/domain/content-section";
import type { AiContentSection } from "@/lib/ai/core/types";
import type { CommerceAiBatchRequest } from "@/lib/commerce-ai/core/batch-types";
import type { CommerceAiSkillId } from "@/lib/commerce-ai/core/types";
import { CommerceAiSkillIdSchema } from "@/lib/commerce-ai/validation/run-request";

const CommerceAiBatchOptionsSchema = z
  .object({
    dryRun: z.boolean().optional(),
    revalidate: z.boolean().optional(),
    overwrite: z.enum(["if_empty", "always", "never"]).optional(),
    provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
    publishStatus: z.enum(["draft", "published"]).optional(),
    sections: z.array(z.enum(["description", "seo", "faq", "alt_text"])).min(1).optional(),
  })
  .optional();

export const CommerceAiBatchRequestBodySchema = z.object({
  skill: CommerceAiSkillIdSchema,
  productIds: z.array(z.number().int().positive()).min(1).max(25),
  locales: z.array(z.enum(["en", "et"])).min(1),
  options: CommerceAiBatchOptionsSchema,
});

export const MAX_COMMERCE_AI_BATCH_JOBS = 30;

export function parseCommerceAiBatchRequestBody(body: unknown): CommerceAiBatchRequest | null {
  const parsed = CommerceAiBatchRequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const sections = parsed.data.options?.sections?.filter(isAiContentSection) as
    | AiContentSection[]
    | undefined;

  if (parsed.data.options?.sections && (!sections || sections.length === 0)) {
    return null;
  }

  const locales = [...new Set(parsed.data.locales)] as Locale[];
  const productIds = [...new Set(parsed.data.productIds)];

  if (productIds.length * locales.length > MAX_COMMERCE_AI_BATCH_JOBS) {
    return null;
  }

  return {
    skill: parsed.data.skill as CommerceAiSkillId,
    productIds,
    locales,
    options: parsed.data.options
      ? {
          dryRun: parsed.data.options.dryRun,
          revalidate: parsed.data.options.revalidate,
          overwrite: parsed.data.options.overwrite,
          provider: parsed.data.options.provider,
          publishStatus: parsed.data.options.publishStatus,
          sections,
        }
      : undefined,
  };
}
