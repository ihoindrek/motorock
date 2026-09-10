import { AiEngineError } from "@/lib/ai/core/errors";
import type { InternalLinksService } from "@/lib/commerce-ai/seo/internal-links.service";
import { createSkillResult, type CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createInternalLinksSkill(deps: {
  internalLinks: InternalLinksService;
}): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "seo.internal_links",
  );

  if (!definition) {
    throw new Error("seo.internal_links definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();
      const postSlug =
        typeof context.target.postSlug === "string"
          ? context.target.postSlug.trim()
          : "";
      const limit = Number(context.target.limit);
      const parsedLimit = Number.isInteger(limit) && limit > 0 ? limit : undefined;

      try {
        const result = await deps.internalLinks.suggest({
          jobId: context.jobId,
          locale: context.locale,
          target: {
            postSlug: postSlug || undefined,
            limit: parsedLimit,
          },
          options: context.options,
        });

        return createSkillResult({
          ok: result.ok,
          jobId: context.jobId,
          skill: "seo.internal_links",
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
            skill: "seo.internal_links",
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
