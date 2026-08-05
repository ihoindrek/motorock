import { getAiConfig } from "@/lib/ai/config";
import { createAiContainer } from "@/lib/ai/core/container";
import { GraphqlProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { BlogGenerateService } from "@/lib/commerce-ai/blog/blog-generate.service";
import { WpBlogWriteRepository } from "@/lib/commerce-ai/blog/wp-blog-write.repository";
import { CommerceAiEngine } from "@/lib/commerce-ai/core/engine";
import { SeoAuditService } from "@/lib/commerce-ai/seo/seo-audit.service";
import { createCommerceAiSkillRegistry } from "@/lib/commerce-ai/skills/registry";

export function createCommerceAiContainer() {
  const config = getAiConfig();
  const { engine: aiEngine, providerRegistry } = createAiContainer();
  const blogGenerate = new BlogGenerateService({
    config,
    providerRegistry,
    productRead: new GraphqlProductReadRepository(),
    blogWrite: new WpBlogWriteRepository(config.wpWriteUrl, config.wpWriteSecret),
  });
  const seoAudit = new SeoAuditService();
  const skills = createCommerceAiSkillRegistry({ aiEngine, blogGenerate, seoAudit });
  const engine = new CommerceAiEngine(skills, { aiEngine });

  return {
    config,
    providerRegistry,
    aiEngine,
    blogGenerate,
    seoAudit,
    engine,
  };
}
