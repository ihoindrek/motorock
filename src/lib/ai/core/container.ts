import { getAiConfig, resolveActiveModel } from "@/lib/ai/config";
import { AiEngine } from "@/lib/ai/core/engine";
import { DescriptionGenerator } from "@/lib/ai/generators/description-generator";
import { FaqGenerator } from "@/lib/ai/generators/faq-generator";
import { AltTextGenerator } from "@/lib/ai/generators/alt-text-generator";
import { SeoGenerator } from "@/lib/ai/generators/seo-generator";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic-provider";
import { OpenAiProvider } from "@/lib/ai/providers/openai-provider";
import { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import { GraphqlProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { WpAiWriteRepository } from "@/lib/ai/repositories/wp-ai-write.repository";

export function createAiContainer() {
  const config = getAiConfig();
  const providerRegistry = new ProviderRegistry({
    openai: new OpenAiProvider(config.openai.apiKey, config.openai.model),
    anthropic: new AnthropicProvider(config.anthropic.apiKey, config.anthropic.model),
  });
  const provider = providerRegistry.get(config.defaultProvider);
  const model = resolveActiveModel(config);

  const engine = new AiEngine({
    config,
    productRead: new GraphqlProductReadRepository(),
    productWrite: new WpAiWriteRepository(config.wpWriteUrl, config.wpWriteSecret),
    generators: {
      description: new DescriptionGenerator(provider, model),
      seo: new SeoGenerator(provider, model),
      faq: new FaqGenerator(provider, model),
      alt_text: new AltTextGenerator(provider, model),
    },
  });

  return {
    config,
    engine,
    providerRegistry,
  };
}
