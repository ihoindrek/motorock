import type { AiEngine } from "@/lib/ai/core/engine";
import { AiEngineError } from "@/lib/ai/core/errors";
import type { AiContentSection } from "@/lib/ai/core/types";
import {
  createSkillResult,
  parseProductId,
  type CommerceAiSkill,
} from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";
import { isAiContentSection } from "@/lib/ai/domain/content-section";

const DEFAULT_SECTIONS: AiContentSection[] = ["description", "seo"];

function resolveSections(sections: AiContentSection[] | undefined) {
  const resolved = (sections ?? DEFAULT_SECTIONS).filter(isAiContentSection);
  return resolved.length > 0 ? resolved : DEFAULT_SECTIONS;
}

export function createProductContentWriterSkill(deps: {
  aiEngine: AiEngine;
}): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "product.content_writer",
  );

  if (!definition) {
    throw new Error("product.content_writer definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();
      const productId = parseProductId(context.target);

      if (!productId) {
        return createSkillResult({
          ok: false,
          jobId: context.jobId,
          skill: "product.content_writer",
          domain: "product",
          durationMs: Date.now() - started,
          dryRun: Boolean(context.options?.dryRun),
          result: null,
          error: "target.productId must be a positive integer",
          code: "invalid_target",
        });
      }

      try {
        const generateResult = await deps.aiEngine.generate({
          productId,
          locale: context.locale,
          sections: resolveSections(context.options?.sections),
          options: context.options,
        });

        return createSkillResult({
          ok: generateResult.ok,
          jobId: context.jobId,
          skill: "product.content_writer",
          domain: "product",
          durationMs: Date.now() - started,
          dryRun: generateResult.dryRun,
          result: generateResult,
        });
      } catch (error) {
        if (error instanceof AiEngineError) {
          return createSkillResult({
            ok: false,
            jobId: context.jobId,
            skill: "product.content_writer",
            domain: "product",
            durationMs: Date.now() - started,
            dryRun: Boolean(context.options?.dryRun),
            result: null,
            error: error.message,
            code: error.code,
          });
        }

        throw error;
      }
    },
  };
}
