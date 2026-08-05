import { AiEngineError } from "@/lib/ai/core/errors";
import type { BlogGenerateService } from "@/lib/commerce-ai/blog/blog-generate.service";
import {
  createSkillResult,
  parseBlogTarget,
  type CommerceAiSkill,
} from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createBlogGenerateSkill(deps: {
  blogGenerate: BlogGenerateService;
}): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find(
    (entry) => entry.id === "content.blog_generate",
  );

  if (!definition) {
    throw new Error("content.blog_generate definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();
      const target = parseBlogTarget(context.target);

      if (!target) {
        return createSkillResult({
          ok: false,
          jobId: context.jobId,
          skill: "content.blog_generate",
          domain: "content",
          durationMs: Date.now() - started,
          dryRun: Boolean(context.options?.dryRun),
          result: null,
          error: "target must include topic, brief, or productId",
          code: "invalid_target",
        });
      }

      try {
        const generateResult = await deps.blogGenerate.generate({
          jobId: context.jobId,
          locale: context.locale,
          target,
          options: context.options,
        });

        return createSkillResult({
          ok: generateResult.ok,
          jobId: context.jobId,
          skill: "content.blog_generate",
          domain: "content",
          durationMs: Date.now() - started,
          dryRun: generateResult.dryRun,
          result: generateResult,
        });
      } catch (error) {
        if (error instanceof AiEngineError) {
          return createSkillResult({
            ok: false,
            jobId: context.jobId,
            skill: "content.blog_generate",
            domain: "content",
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
