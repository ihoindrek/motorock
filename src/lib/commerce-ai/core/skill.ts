import type {
  CommerceAiDomain,
  CommerceAiRunOptions,
  CommerceAiRunRequest,
  CommerceAiRunResult,
  CommerceAiSkillDefinition,
  CommerceAiSkillId,
} from "@/lib/commerce-ai/core/types";
import type { SeoAuditScope, SeoAuditTarget } from "@/lib/commerce-ai/seo/audit-types";
import { SEO_AUDIT_CHUNK_SIZE } from "@/lib/commerce-ai/seo/audit-types";
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

export function parseSeoAuditTarget(target: CommerceAiRunRequest["target"]): SeoAuditTarget {
  const scope = target.scope;
  let parsedScope: SeoAuditScope | undefined;
  if (scope === "products" || scope === "posts" || scope === "all") {
    parsedScope = scope;
  }

  const category =
    typeof target.category === "string" && target.category.trim()
      ? target.category.trim()
      : undefined;

  const limit = Number(target.limit);
  const parsedLimit = Number.isInteger(limit) && limit > 0 ? limit : undefined;

  const chunkSize = Number(target.chunkSize);
  const parsedChunkSize =
    Number.isInteger(chunkSize) && chunkSize > 0 ? Math.min(chunkSize, SEO_AUDIT_CHUNK_SIZE) : undefined;

  const offset = Number(target.offset);
  let parsedOffset = Number.isInteger(offset) && offset >= 0 ? offset : undefined;
  if (parsedOffset === undefined && parsedChunkSize !== undefined) {
    parsedOffset = 0;
  }

  return {
    scope: parsedScope,
    category,
    limit: parsedLimit,
    offset: parsedOffset,
    chunkSize: parsedChunkSize,
  };
}
