import { getAiConfig, resolveActiveModel } from "@/lib/ai/config";
import { AiEngine } from "@/lib/ai/core/engine";
import { DescriptionGenerator } from "@/lib/ai/generators/description-generator";
import { FaqGenerator } from "@/lib/ai/generators/faq-generator";
import { AltTextGenerator } from "@/lib/ai/generators/alt-text-generator";
import { SeoGenerator } from "@/lib/ai/generators/seo-generator";
import { createProviderRegistry } from "@/lib/ai/providers/create-provider-registry";
import { GraphqlProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { WpAiWriteRepository } from "@/lib/ai/repositories/wp-ai-write.repository";

export function createAiContainer() {
  const config = getAiConfig();
  const providerRegistry = createProviderRegistry(config);

  const engine = new AiEngine({
    config,
    providerRegistry,
    productRead: new GraphqlProductReadRepository(),
    productWrite: new WpAiWriteRepository(config.wpWriteUrl, config.wpWriteSecret),
    generators: {
      description: new DescriptionGenerator(),
      seo: new SeoGenerator(),
      faq: new FaqGenerator(),
      alt_text: new AltTextGenerator(),
    },
  });

  return {
    config,
    engine,
    providerRegistry,
  };
}

export { resolveActiveModel };
