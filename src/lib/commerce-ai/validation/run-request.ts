import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { isAiContentSection } from "@/lib/ai/domain/content-section";
import type { AiContentSection } from "@/lib/ai/core/types";
import type { CommerceAiRunRequest, CommerceAiSkillId } from "@/lib/commerce-ai/core/types";

export const CommerceAiSkillIdSchema = z.enum([
  "product.content_writer",
  "content.blog_generate",
  "catalog.fill_attributes",
  "catalog.related_products",
  "catalog.detect_duplicates",
  "catalog.organize_categories",
  "seo.audit",
  "seo.internal_links",
  "seo.fix_404",
  "intelligence.pricing",
  "content.email_campaign",
  "support.cs_replies",
]);

const CommerceAiRunOptionsSchema = z
  .object({
    dryRun: z.boolean().optional(),
    revalidate: z.boolean().optional(),
    overwrite: z.enum(["if_empty", "always", "never"]).optional(),
    provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
    publishStatus: z.enum(["draft", "published"]).optional(),
    sections: z.array(z.enum(["description", "seo", "faq", "alt_text"])).min(1).optional(),
  })
  .optional();

export const CommerceAiRunRequestBodySchema = z.object({
  skill: CommerceAiSkillIdSchema,
  locale: z.enum(["en", "et"]),
  target: z.record(z.string(), z.unknown()),
  options: CommerceAiRunOptionsSchema,
});

export function parseCommerceAiRunRequestBody(body: unknown): CommerceAiRunRequest | null {
  const parsed = CommerceAiRunRequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const sections = parsed.data.options?.sections?.filter(isAiContentSection) as
    | AiContentSection[]
    | undefined;

  if (parsed.data.options?.sections && (!sections || sections.length === 0)) {
    return null;
  }

  return {
    skill: parsed.data.skill as CommerceAiSkillId,
    locale: parsed.data.locale as Locale,
    target: parsed.data.target,
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
