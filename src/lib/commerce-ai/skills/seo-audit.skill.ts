import type { SeoAuditService } from "@/lib/commerce-ai/seo/seo-audit.service";
import {
  createSkillResult,
  parseSeoAuditTarget,
  type CommerceAiSkill,
} from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

export function createSeoAuditSkill(deps: { seoAudit: SeoAuditService }): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find((entry) => entry.id === "seo.audit");

  if (!definition) {
    throw new Error("seo.audit definition is missing from catalog");
  }

  return {
    definition,
    async run(context) {
      const started = Date.now();

      try {
        const report = await deps.seoAudit.run({
          jobId: context.jobId,
          locale: context.locale,
          target: parseSeoAuditTarget(context.target),
        });

        return createSkillResult({
          ok: report.ok,
          jobId: context.jobId,
          skill: "seo.audit",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: true,
          result: report,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "SEO audit failed";

        return createSkillResult({
          ok: false,
          jobId: context.jobId,
          skill: "seo.audit",
          domain: "seo",
          durationMs: Date.now() - started,
          dryRun: true,
          result: null,
          error: message,
          code: "audit_failed",
        });
      }
    },
  };
}
