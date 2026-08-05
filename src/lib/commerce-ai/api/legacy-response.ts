import type { BatchJobResult, GenerateJobResult } from "@/lib/ai/core/types";
import type { CommerceAiBatchResult } from "@/lib/commerce-ai/core/batch-types";
import type { CommerceAiRunResult } from "@/lib/commerce-ai/core/types";

export function unwrapCommerceAiGenerateResult(
  result: CommerceAiRunResult,
): GenerateJobResult | CommerceAiRunResult {
  if (
    result.ok &&
    result.result &&
    typeof result.result === "object" &&
    "results" in result.result
  ) {
    return result.result as GenerateJobResult;
  }

  return result;
}

export function unwrapCommerceAiBatchResult(result: CommerceAiBatchResult): BatchJobResult {
  return {
    ok: result.ok,
    batchId: result.batchId,
    dryRun: result.dryRun,
    total: result.total,
    succeeded: result.succeeded,
    failed: result.failed,
    jobs: result.jobs,
    revalidated: result.revalidated,
    durationMs: result.durationMs,
  };
}
