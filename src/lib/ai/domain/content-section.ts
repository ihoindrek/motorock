import type { AiContentSection } from "@/lib/ai/core/types";

export const AI_CONTENT_SECTIONS = [
  "description",
  "seo",
  "faq",
  "alt_text",
] as const satisfies readonly AiContentSection[];

export function isAiContentSection(value: string): value is AiContentSection {
  return AI_CONTENT_SECTIONS.includes(value as AiContentSection);
}

/** Woo meta keys written by motorock-ai-writer. */
export const AI_PRODUCT_META_KEYS = {
  seoTitle: "_motorock_ai_seo_title",
  seoMetaDescription: "_motorock_ai_seo_meta_description",
  seoKeywords: "_motorock_ai_seo_keywords",
  faq: "_motorock_ai_faq",
  contentStatus: "_motorock_ai_content_status",
  generatedAt: "_motorock_ai_generated_at",
  provider: "_motorock_ai_provider",
  model: "_motorock_ai_model",
  promptVersion: "_motorock_ai_prompt_version",
  jobId: "_motorock_ai_job_id",
  sections: "_motorock_ai_sections",
  draftShortDescription: "_motorock_ai_draft_short_description",
  draftDescription: "_motorock_ai_draft_description",
  draftSeoTitle: "_motorock_ai_draft_seo_title",
  draftSeoMetaDescription: "_motorock_ai_draft_seo_meta_description",
  draftSeoKeywords: "_motorock_ai_draft_seo_keywords",
  draftFaq: "_motorock_ai_draft_faq",
  draftAltTexts: "_motorock_ai_draft_alt_texts",
} as const;

export type AiContentStatus = "draft" | "published";

export type AiPublishStatus = AiContentStatus;
