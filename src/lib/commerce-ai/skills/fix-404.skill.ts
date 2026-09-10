import { AiEngineError } from "@/lib/ai/core/errors";
import type { Fix404Service } from "@/lib/commerce-ai/seo/fix-404.service";
import { createSkillResult, type CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createFix404Skill(deps: { fix404: Fix404Service }): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "seo.fix_404",
  );

  if (!definition) {
    throw new Error("seo.fix_404 definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();
      const urls =
        typeof context.target.urls === "string"
          ? context.target.urls
          : Array.isArray(context.target.urls)
            ? context.target.urls.join("\n")
            : "";

      if (!urls.trim()) {
        return createSkillResult({
          ok: false,
          jobId: context.jobId,
          skill: "seo.fix_404",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: true,
          result: null,
          error: "target must include urls (broken URL list)",
          code: "invalid_target",
        });
      }

      try {
        const result = await deps.fix404.suggest({
          jobId: context.jobId,
          locale: context.locale,
          target: { urls },
          options: context.options,
        });

        return createSkillResult({
          ok: result.ok,
          jobId: context.jobId,
          skill: "seo.fix_404",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: true,
          result,
        });
      } catch (error) {
        if (error instanceof AiEngineError) {
          return createSkillResult({
            ok: false,
            jobId: context.jobId,
            skill: "seo.fix_404",
            domain: "seo",
            durationMs: Date.now() - started,
            dryRun: true,
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
