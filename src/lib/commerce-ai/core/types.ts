import type { Locale } from "@/i18n/config";
import type { AiContentSection, AiGenerateOptions } from "@/lib/ai/core/types";

export type CommerceAiSkillStatus = "active" | "planned";

export type CommerceAiDomain =
  | "product"
  | "content"
  | "catalog"
  | "seo"
  | "intelligence"
  | "support";

/** Stable skill identifiers for the Commerce AI Engine. */
export type CommerceAiSkillId =
  | "product.content_writer"
  | "content.blog_generate"
  | "catalog.fill_attributes"
  | "catalog.related_products"
  | "catalog.detect_duplicates"
  | "catalog.organize_categories"
  | "seo.audit"
  | "seo.internal_links"
  | "seo.fix_404"
  | "intelligence.pricing"
  | "content.email_campaign"
  | "support.cs_replies";

export type CommerceAiSkillDefinition = {
  id: CommerceAiSkillId;
  domain: CommerceAiDomain;
  status: CommerceAiSkillStatus;
  title: string;
  description: string;
};

export type CommerceAiRunOptions = AiGenerateOptions & {
  sections?: AiContentSection[];
};

export type CommerceAiRunRequest = {
  skill: CommerceAiSkillId;
  locale: Locale;
  target: Record<string, unknown>;
  options?: CommerceAiRunOptions;
};

export type CommerceAiRunResult = {
  ok: boolean;
  jobId: string;
  skill: CommerceAiSkillId;
  domain: CommerceAiDomain;
  durationMs: number;
  dryRun: boolean;
  result: unknown;
  error?: string;
  code?: string;
};
