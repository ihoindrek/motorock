import { describe, expect, it, vi } from "vitest";
import { CommerceAiEngine } from "@/lib/commerce-ai/core/engine";
import type { CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import { COMMERCE_AI_SKILL_CATALOG } from "@/lib/commerce-ai/skills/catalog";

vi.mock("@/lib/monitoring/observability", () => ({
  logStorefrontEvent: vi.fn(),
}));

function createMockSkill(
  id: "product.content_writer",
  run: CommerceAiSkill["run"],
): CommerceAiSkill {
  const definition = COMMERCE_AI_SKILL_CATALOG.find((entry) => entry.id === id);
  if (!definition) {
    throw new Error("missing definition");
  }

  return { definition, run };
}

describe("CommerceAiEngine", () => {
  it("lists catalog entries with runnable flag", () => {
    const skills = new Map<string, CommerceAiSkill>();
    skills.set(
      "product.content_writer",
      createMockSkill("product.content_writer", vi.fn()),
    );

    const engine = new CommerceAiEngine(skills, {
      aiEngine: {
        generateBatch: vi.fn(),
      } as never,
    });
    const listed = engine.listSkills();

    expect(listed.find((entry) => entry.id === "product.content_writer")?.runnable).toBe(true);
    expect(listed.find((entry) => entry.id === "seo.audit")?.runnable).toBe(false);
    expect(listed.find((entry) => entry.id === "seo.audit")?.status).toBe("planned");
  });

  it("returns not_implemented for planned skills", async () => {
    const engine = new CommerceAiEngine(new Map(), {
      aiEngine: { generateBatch: vi.fn() } as never,
    });

    const result = await engine.run({
      skill: "seo.audit",
      locale: "en",
      target: {},
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("not_implemented");
    expect(result.domain).toBe("seo");
  });

  it("delegates active skills to the registered handler", async () => {
    const run = vi.fn(async () => ({
      ok: true,
      jobId: "commerce_test",
      skill: "product.content_writer" as const,
      domain: "product" as const,
      durationMs: 12,
      dryRun: true,
      result: { preview: true },
    }));

    const skills = new Map<string, CommerceAiSkill>();
    skills.set("product.content_writer", createMockSkill("product.content_writer", run));

    const engine = new CommerceAiEngine(skills, {
      aiEngine: {
        generateBatch: vi.fn(),
      } as never,
    });
    const result = await engine.run({
      skill: "product.content_writer",
      locale: "et",
      target: { productId: 42 },
      options: { dryRun: true, sections: ["description"] },
    });

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "et",
        target: { productId: 42 },
        options: { dryRun: true, sections: ["description"] },
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.result).toEqual({ preview: true });
  });
});
