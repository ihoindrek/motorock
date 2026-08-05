import type {
  CommerceAiDomain,
  CommerceAiRunOptions,
  CommerceAiRunRequest,
  CommerceAiRunResult,
  CommerceAiSkillDefinition,
  CommerceAiSkillId,
} from "@/lib/commerce-ai/core/types";
import type { Locale } from "@/i18n/config";

export type CommerceAiSkillContext = {
  jobId: string;
  locale: Locale;
  target: Record<string, unknown>;
  options?: CommerceAiRunOptions;
};

export type CommerceAiSkill = {
  definition: CommerceAiSkillDefinition;
  run: (context: CommerceAiSkillContext) => Promise<CommerceAiRunResult>;
};

export function createSkillResult(input: {
  ok: boolean;
  jobId: string;
  skill: CommerceAiSkillId;
  domain: CommerceAiDomain;
  durationMs: number;
  dryRun: boolean;
  result: unknown;
  error?: string;
  code?: string;
}): CommerceAiRunResult {
  return input;
}

export function parseProductId(target: CommerceAiRunRequest["target"]) {
  const productId = Number(target.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return productId;
}

export function parseBlogTarget(target: CommerceAiRunRequest["target"]) {
  const topic = typeof target.topic === "string" ? target.topic.trim() : "";
  const brief = typeof target.brief === "string" ? target.brief.trim() : "";
  const productId = Number(target.productId);
  const hasProductId = Number.isInteger(productId) && productId > 0;

  if (!topic && !brief && !hasProductId) {
    return null;
  }

  return {
    topic: topic || undefined,
    brief: brief || undefined,
    productId: hasProductId ? productId : undefined,
  };
}

export function parseSeoAuditTarget(target: CommerceAiRunRequest["target"]) {
  const scope = target.scope;
  const parsedScope =
    scope === "products" || scope === "posts" || scope === "all" ? scope : undefined;

  const category =
    typeof target.category === "string" && target.category.trim()
      ? target.category.trim()
      : undefined;

  const limit = Number(target.limit);
  const parsedLimit = Number.isInteger(limit) && limit > 0 ? limit : undefined;

  return {
    scope: parsedScope,
    category,
    limit: parsedLimit,
  };
}
