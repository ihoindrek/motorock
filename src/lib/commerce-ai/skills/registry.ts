import type { AiEngine } from "@/lib/ai/core/engine";
import type { BlogGenerateService } from "@/lib/commerce-ai/blog/blog-generate.service";
import type { CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import type { CommerceAiSkillId } from "@/lib/commerce-ai/core/types";
import { createBlogGenerateSkill } from "@/lib/commerce-ai/skills/blog-generate.skill";
import { createProductContentWriterSkill } from "@/lib/commerce-ai/skills/product-content-writer.skill";

export function createCommerceAiSkillRegistry(deps: {
  aiEngine: AiEngine;
  blogGenerate: BlogGenerateService;
}) {
  const skills = new Map<CommerceAiSkillId, CommerceAiSkill>();

  skills.set("product.content_writer", createProductContentWriterSkill(deps));
  skills.set("content.blog_generate", createBlogGenerateSkill(deps));

  return skills;
}
