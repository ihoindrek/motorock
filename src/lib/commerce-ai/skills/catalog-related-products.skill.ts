import { AiEngineError } from "@/lib/ai/core/errors";
import type { RelatedProductsService } from "@/lib/commerce-ai/catalog/related-products.service";
import {
  createSkillResult,
  parseProductId,
  type CommerceAiSkill,
} from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createRelatedProductsSkill(deps: {
  relatedProducts: RelatedProductsService;
}): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "catalog.related_products",
  );

  if (!definition) {
    throw new Error("catalog.related_products definition is missing from catalog");
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
          skill: "catalog.related_products",
          domain: "catalog",
          durationMs: Date.now() - started,
          dryRun: Boolean(context.options?.dryRun),
          result: null,
          error: "target.productId is required",
          code: "invalid_target",
        });
      }

      try {
        const generateResult = await deps.relatedProducts.generate({
          jobId: context.jobId,
          locale: context.locale,
          productId,
          options: context.options,
        });

        return createSkillResult({
          ok: generateResult.ok,
          jobId: context.jobId,
          skill: "catalog.related_products",
          domain: "catalog",
          durationMs: Date.now() - started,
          dryRun: generateResult.dryRun,
          result: generateResult,
        });
      } catch (error) {
        if (error instanceof AiEngineError) {
          return createSkillResult({
            ok: false,
            jobId: context.jobId,
            skill: "catalog.related_products",
            domain: "catalog",
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
