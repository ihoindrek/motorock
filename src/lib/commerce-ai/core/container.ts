import { getAiConfig } from "@/lib/ai/config";
import { createAiContainer } from "@/lib/ai/core/container";
import { GraphqlProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { BlogGenerateService } from "@/lib/commerce-ai/blog/blog-generate.service";
import { WpBlogWriteRepository } from "@/lib/commerce-ai/blog/wp-blog-write.repository";
import { RelatedProductsService } from "@/lib/commerce-ai/catalog/related-products.service";
import { WpRelatedProductsWriteRepository } from "@/lib/commerce-ai/catalog/wp-related-write.repository";
import { CommerceAiEngine } from "@/lib/commerce-ai/core/engine";
import { CategoryContentService } from "@/lib/commerce-ai/seo/category-content.service";
import { Fix404Service } from "@/lib/commerce-ai/seo/fix-404.service";
import { InternalLinksService } from "@/lib/commerce-ai/seo/internal-links.service";
import { SeoAuditService } from "@/lib/commerce-ai/seo/seo-audit.service";
import { WpTermWriteRepository } from "@/lib/commerce-ai/seo/wp-term-write.repository";
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
  const relatedProducts = new RelatedProductsService({
    config,
    providerRegistry,
    productRead: new GraphqlProductReadRepository(),
    relatedWrite: new WpRelatedProductsWriteRepository(
      config.wpWriteUrl,
      config.wpWriteSecret,
    ),
  });
  const seoAudit = new SeoAuditService();
  const categoryContent = new CategoryContentService({
    config,
    providerRegistry,
    termWrite: new WpTermWriteRepository(config.wpWriteUrl, config.wpWriteSecret),
  });
  const internalLinks = new InternalLinksService({ config, providerRegistry });
  const fix404 = new Fix404Service({ config, providerRegistry });
  const skills = createCommerceAiSkillRegistry({
    aiEngine,
    blogGenerate,
    relatedProducts,
    seoAudit,
    categoryContent,
    internalLinks,
    fix404,
  });
  const engine = new CommerceAiEngine(skills, { aiEngine });

  return {
    config,
    providerRegistry,
    aiEngine,
    blogGenerate,
    relatedProducts,
    seoAudit,
    categoryContent,
    internalLinks,
    fix404,
    engine,
  };
}
