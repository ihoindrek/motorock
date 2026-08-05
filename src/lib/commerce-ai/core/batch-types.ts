import type { Locale } from "@/i18n/config";
import type { AiContentSection, AiGenerateOptions, BatchJobResult } from "@/lib/ai/core/types";
import type { CommerceAiRunOptions, CommerceAiSkillId } from "@/lib/commerce-ai/core/types";

export type CommerceAiBatchRequest = {
  skill: CommerceAiSkillId;
  productIds: number[];
  locales: Locale[];
  options?: CommerceAiRunOptions;
};

export type CommerceAiBatchResult = {
  ok: boolean;
  batchId: string;
  skill: CommerceAiSkillId;
  dryRun: boolean;
  total: number;
  succeeded: number;
  failed: number;
  jobs: BatchJobResult["jobs"];
  revalidated: boolean;
  durationMs: number;
};

export type CommerceAiLegacyGenerateResult = {
  ok: boolean;
  jobId: string;
  productId: number;
  locale: Locale;
  dryRun: boolean;
  results: Array<{
    section: AiContentSection;
    locale: Locale;
    status: string;
    message?: string;
    validationErrors?: string[];
  }>;
  revalidated: boolean;
  durationMs: number;
};
