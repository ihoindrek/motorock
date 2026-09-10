import type { AiEngine } from "@/lib/ai/core/engine";
import type { BlogGenerateService } from "@/lib/commerce-ai/blog/blog-generate.service";
import type { RelatedProductsService } from "@/lib/commerce-ai/catalog/related-products.service";
import type { CategoryContentService } from "@/lib/commerce-ai/seo/category-content.service";
import type { Fix404Service } from "@/lib/commerce-ai/seo/fix-404.service";
import type { InternalLinksService } from "@/lib/commerce-ai/seo/internal-links.service";
import type { SeoAuditService } from "@/lib/commerce-ai/seo/seo-audit.service";
import type { CommerceAiSkill } from "@/lib/commerce-ai/core/skill";
import type { CommerceAiSkillId } from "@/lib/commerce-ai/core/types";
import { createBlogGenerateSkill } from "@/lib/commerce-ai/skills/blog-generate.skill";
import { createCategoryContentSkill } from "@/lib/commerce-ai/skills/category-content.skill";
import { createFix404Skill } from "@/lib/commerce-ai/skills/fix-404.skill";
import { createInternalLinksSkill } from "@/lib/commerce-ai/skills/internal-links.skill";
import { createRelatedProductsSkill } from "@/lib/commerce-ai/skills/catalog-related-products.skill";
import { createProductContentWriterSkill } from "@/lib/commerce-ai/skills/product-content-writer.skill";
import { createSeoAuditSkill } from "@/lib/commerce-ai/skills/seo-audit.skill";

export function createCommerceAiSkillRegistry(deps: {
  aiEngine: AiEngine;
  blogGenerate: BlogGenerateService;
  relatedProducts: RelatedProductsService;
  seoAudit: SeoAuditService;
  categoryContent: CategoryContentService;
  internalLinks: InternalLinksService;
  fix404: Fix404Service;
}) {
  const skills = new Map<CommerceAiSkillId, CommerceAiSkill>();

  skills.set("product.content_writer", createProductContentWriterSkill(deps));
  skills.set("content.blog_generate", createBlogGenerateSkill(deps));
  skills.set("catalog.related_products", createRelatedProductsSkill(deps));
  skills.set("seo.audit", createSeoAuditSkill(deps));
  skills.set("seo.category_content", createCategoryContentSkill(deps));
  skills.set("seo.internal_links", createInternalLinksSkill(deps));
  skills.set("seo.fix_404", createFix404Skill(deps));

  return skills;
}
