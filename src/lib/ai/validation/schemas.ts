import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { isAiContentSection } from "@/lib/ai/domain/content-section";
import type { AiContentSection, AiOverwriteStrategy } from "@/lib/ai/core/types";

export const DescriptionSectionSchema = z.object({
  shortDescription: z.string().min(40).max(600),
  description: z.string().min(200).max(8000),
});

export type DescriptionSectionOutput = z.infer<typeof DescriptionSectionSchema>;

export const SeoSectionSchema = z.object({
  title: z.string().min(20).max(58),
  metaDescription: z.string().min(80).max(160),
  keywords: z.array(z.string().min(2).max(40)).min(3).max(12),
});

export type SeoSectionOutput = z.infer<typeof SeoSectionSchema>;

export const FaqItemSchema = z.object({
  question: z.string().min(10).max(200),
  answer: z.string().min(20).max(800),
});

export const FaqSectionSchema = z.object({
  items: z.array(FaqItemSchema).min(3).max(8),
});

export type FaqSectionOutput = z.infer<typeof FaqSectionSchema>;

export const AltTextItemSchema = z.object({
  imageIndex: z.number().int().min(0).max(20),
  altText: z.string().min(20).max(125),
});

export const AltTextSectionSchema = z.object({
  items: z.array(AltTextItemSchema).min(1).max(12),
});

export type AltTextSectionOutput = z.infer<typeof AltTextSectionSchema>;

/** Looser bounds for LLM parse — clamped before validation. */
export const SeoSectionLooseSchema = z.object({
  title: z.string().min(10).max(120),
  metaDescription: z.string().min(40).max(400),
  keywords: z.array(z.string().min(2).max(60)).min(1).max(20),
});

export const AiStructuredResponseSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("description"),
    locale: z.enum(["en", "et"]),
    productId: z.number().int().positive(),
    output: DescriptionSectionSchema,
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    section: z.literal("seo"),
    locale: z.enum(["en", "et"]),
    productId: z.number().int().positive(),
    output: SeoSectionSchema,
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    section: z.literal("faq"),
    locale: z.enum(["en", "et"]),
    productId: z.number().int().positive(),
    output: FaqSectionSchema,
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    section: z.literal("alt_text"),
    locale: z.enum(["en", "et"]),
    productId: z.number().int().positive(),
    output: AltTextSectionSchema,
    confidence: z.number().min(0).max(1).optional(),
  }),
]);

export type AiStructuredResponse = z.infer<typeof AiStructuredResponseSchema>;

export const SectionWriteResultSchema = z.object({
  section: z.enum(["description", "seo", "faq", "alt_text"]),
  locale: z.enum(["en", "et"]),
  status: z.enum(["written", "skipped", "failed", "validation_failed"]),
  message: z.string().optional(),
  validationErrors: z.array(z.string()).optional(),
});

export const GenerateResponseSchema = z.object({
  ok: z.boolean(),
  jobId: z.string(),
  productId: z.number(),
  locale: z.enum(["en", "et"]),
  dryRun: z.boolean(),
  results: z.array(SectionWriteResultSchema),
  revalidated: z.boolean(),
  durationMs: z.number(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export const AiWritePayloadSchema = z.object({
  productId: z.number().int().positive(),
  locale: z.enum(["en", "et"]),
  sections: z.array(
    z.discriminatedUnion("section", [
      z.object({
        section: z.literal("description"),
        shortDescription: z.string(),
        description: z.string(),
      }),
      z.object({
        section: z.literal("seo"),
        title: z.string(),
        metaDescription: z.string(),
        keywords: z.array(z.string()),
      }),
      z.object({
        section: z.literal("faq"),
        items: z.array(FaqItemSchema),
      }),
      z.object({
        section: z.literal("alt_text"),
        items: z.array(
          z.object({
            imageId: z.number().int().positive().optional(),
            imageIndex: z.number().int().min(0),
            altText: z.string(),
          }),
        ),
      }),
    ]),
  ),
  meta: z.object({
    provider: z.string(),
    promptVersion: z.string(),
    model: z.string(),
    generatedAt: z.string().datetime(),
    jobId: z.string(),
  }),
  publishStatus: z.enum(["draft", "published"]).optional(),
  motorcycle: z
    .object({
      supplierDescriptionHtml: z.string().optional(),
      specsSnapshotJson: z.string().optional(),
    })
    .optional(),
});

export type AiWritePayload = z.infer<typeof AiWritePayloadSchema>;

const OverwriteStrategySchema = z.enum(["if_empty", "always", "never"]);

const AiGenerateOptionsObjectSchema = z.object({
  dryRun: z.boolean().optional(),
  revalidate: z.boolean().optional(),
  overwrite: OverwriteStrategySchema.optional(),
  provider: z
    .union([z.enum(["openai", "anthropic", "gemini"]), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  publishStatus: z.enum(["draft", "published"]).optional(),
});

const AiGenerateOptionsSchema = AiGenerateOptionsObjectSchema.optional();

export const AiGenerateRequestBodySchema = z.object({
  productId: z.number().int().positive(),
  locale: z.enum(["en", "et"]),
  sections: z.array(z.enum(["description", "seo", "faq", "alt_text"])).min(1),
  options: AiGenerateOptionsSchema,
});

export const AiBatchRequestBodySchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1).max(25),
  locales: z.array(z.enum(["en", "et"])).min(1).default(["en"]),
  sections: z.array(z.enum(["description", "seo", "faq", "alt_text"])).min(1),
  options: AiGenerateOptionsSchema,
});

export const MAX_AI_BATCH_JOBS = 30;

export function parseAiGenerateRequestBody(body: unknown) {
  const parsed = AiGenerateRequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const sections = parsed.data.sections.filter(isAiContentSection);
  if (sections.length === 0) {
    return null;
  }

  return {
    productId: parsed.data.productId,
    locale: parsed.data.locale as Locale,
    sections: sections as AiContentSection[],
    options: {
      dryRun: parsed.data.options?.dryRun,
      revalidate: parsed.data.options?.revalidate,
      overwrite: parsed.data.options?.overwrite as AiOverwriteStrategy | undefined,
      provider: parsed.data.options?.provider,
      publishStatus: parsed.data.options?.publishStatus,
    },
  };
}

export function parseAiBatchRequestBody(body: unknown) {
  const parsed = AiBatchRequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  const sections = parsed.data.sections.filter(isAiContentSection);
  if (sections.length === 0) {
    return null;
  }

  const locales = [...new Set(parsed.data.locales)] as Locale[];
  const productIds = [...new Set(parsed.data.productIds)];

  if (productIds.length * locales.length > MAX_AI_BATCH_JOBS) {
    return null;
  }

  return {
    productIds,
    locales,
    sections: sections as AiContentSection[],
    options: {
      dryRun: parsed.data.options?.dryRun,
      revalidate: parsed.data.options?.revalidate,
      overwrite: parsed.data.options?.overwrite as AiOverwriteStrategy | undefined,
      provider: parsed.data.options?.provider,
      publishStatus: parsed.data.options?.publishStatus,
    },
  };
}

export function parseLocale(value: string | null | undefined): Locale | null {
  return isLocale(value) ? value : null;
}
