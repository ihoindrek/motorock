import { AiEngineError } from "@/lib/ai/core/errors";
import type { CategoryContentService } from "@/lib/commerce-ai/seo/category-content.service";
import { createSkillResult, type CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createCategoryContentSkill(deps: {
  categoryContent: CategoryContentService;
}): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "seo.category_content",
  );

  if (!definition) {
    throw new Error("seo.category_content definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();
      const categorySlug =
        typeof context.target.categorySlug === "string"
          ? context.target.categorySlug.trim().toLowerCase()
          : "";

      if (!categorySlug) {
        return createSkillResult({
          ok: false,
          jobId: context.jobId,
          skill: "seo.category_content",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: Boolean(context.options?.dryRun),
          result: null,
          error: "target must include categorySlug",
          code: "invalid_target",
        });
      }

      try {
        const generateResult = await deps.categoryContent.generate({
          jobId: context.jobId,
          locale: context.locale,
          target: {
            categorySlug,
            bothLocales: context.target.bothLocales === true,
          },
          options: context.options,
        });

        return createSkillResult({
          ok: generateResult.ok,
          jobId: context.jobId,
          skill: "seo.category_content",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: generateResult.dryRun,
          result: generateResult,
        });
      } catch (error) {
        if (error instanceof AiEngineError) {
          return createSkillResult({
            ok: false,
            jobId: context.jobId,
            skill: "seo.category_content",
            domain: "seo",
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
