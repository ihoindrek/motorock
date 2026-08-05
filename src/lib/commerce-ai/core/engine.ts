import type { AiEngine } from "@/lib/ai/core/engine";
import type { AiContentSection } from "@/lib/ai/core/types";
import { isAiContentSection } from "@/lib/ai/domain/content-section";
import type {
  CommerceAiBatchRequest,
  CommerceAiBatchResult,
} from "@/lib/commerce-ai/core/batch-types";
import type { CommerceAiRunRequest, CommerceAiRunResult } from "@/lib/commerce-ai/core/types";
import { createCommerceJobId } from "@/lib/commerce-ai/core/job-id";
import type { CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

const DEFAULT_BATCH_SECTIONS: AiContentSection[] = ["description", "seo"];

type CommerceAiEngineDeps = {
  aiEngine: AiEngine;
};

export class CommerceAiEngine {
  constructor(
    private readonly skills: Map<string, CommerceAiSkill>,
    private readonly deps: CommerceAiEngineDeps,
  ) {}

  listSkills() {
    return COMMERCE_AI_SKILL_CATALOG.map((definition) => {
      const registered = this.skills.has(definition.id);
      return {
        ...definition,
        runnable: definition.status === "active" && registered,
      };
    });
  }

  async run(request: CommerceAiRunRequest): Promise<CommerceAiRunResult> {
    const started = Date.now();
    const jobId = createCommerceJobId();
    const definition = COMMERCE_AI_SKILL_CATALOG.find((entry) => entry.id === request.skill);

    if (!definition) {
      return this.buildFailure({
        jobId,
        skill: request.skill,
        domain: "product",
        started,
        dryRun: Boolean(request.options?.dryRun),
        error: `Unknown skill "${request.skill}"`,
        code: "unknown_skill",
      });
    }

    const skill = this.skills.get(request.skill);
    if (!skill) {
      return this.buildFailure({
        jobId,
        skill: request.skill,
        domain: definition.domain,
        started,
        dryRun: Boolean(request.options?.dryRun),
        error:
          definition.status === "planned"
            ? "This skill is planned but not implemented yet"
            : `Skill "${request.skill}" is not registered`,
        code: "not_implemented",
      });
    }

    try {
      const result = await skill.run({
        jobId,
        locale: request.locale,
        target: request.target,
        options: request.options,
      });

      logStorefrontEvent("commerce-ai.run", {
        jobId: result.jobId,
        skill: result.skill,
        domain: result.domain,
        ok: result.ok,
        dryRun: result.dryRun,
        durationMs: result.durationMs,
        code: result.code,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Commerce AI run failed";

      logStorefrontEvent("commerce-ai.run", {
        jobId,
        skill: request.skill,
        domain: definition.domain,
        ok: false,
        dryRun: Boolean(request.options?.dryRun),
        durationMs: Date.now() - started,
        error: message,
      });

      throw error;
    }
  }

  async runBatch(request: CommerceAiBatchRequest): Promise<CommerceAiBatchResult> {
    const started = Date.now();
    const batchId = createCommerceJobId();
    const definition = COMMERCE_AI_SKILL_CATALOG.find((entry) => entry.id === request.skill);

    if (!definition || definition.status !== "active" || request.skill !== "product.content_writer") {
      return {
        ok: false,
        batchId,
        skill: request.skill,
        dryRun: Boolean(request.options?.dryRun),
        total: 0,
        succeeded: 0,
        failed: 0,
        jobs: [],
        revalidated: false,
        durationMs: Date.now() - started,
      };
    }

    const sections = (request.options?.sections ?? DEFAULT_BATCH_SECTIONS).filter(isAiContentSection);
    const batchResult = await this.deps.aiEngine.generateBatch({
      productIds: request.productIds,
      locales: request.locales,
      sections: sections.length > 0 ? sections : DEFAULT_BATCH_SECTIONS,
      options: request.options,
    });

    const result: CommerceAiBatchResult = {
      ok: batchResult.ok,
      batchId,
      skill: request.skill,
      dryRun: batchResult.dryRun,
      total: batchResult.total,
      succeeded: batchResult.succeeded,
      failed: batchResult.failed,
      jobs: batchResult.jobs,
      revalidated: batchResult.revalidated,
      durationMs: Date.now() - started,
    };

    logStorefrontEvent("commerce-ai.batch", {
      batchId: result.batchId,
      skill: result.skill,
      ok: result.ok,
      dryRun: result.dryRun,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      durationMs: result.durationMs,
    });

    return result;
  }

  private buildFailure(input: {
    jobId: string;
    skill: CommerceAiRunRequest["skill"];
    domain: CommerceAiRunResult["domain"];
    started: number;
    dryRun: boolean;
    error: string;
    code: string;
  }): CommerceAiRunResult {
    const result: CommerceAiRunResult = {
      ok: false,
      jobId: input.jobId,
      skill: input.skill,
      domain: input.domain,
      durationMs: Date.now() - input.started,
      dryRun: input.dryRun,
      result: null,
      error: input.error,
      code: input.code,
    };

    logStorefrontEvent("commerce-ai.run", {
      jobId: result.jobId,
      skill: result.skill,
      domain: result.domain,
      ok: false,
      dryRun: result.dryRun,
      durationMs: result.durationMs,
      code: result.code,
    });

    return result;
  }
}
