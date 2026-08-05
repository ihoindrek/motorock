import type { AiConfig } from "@/lib/ai/config";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { OpenAiProvider } from "@/lib/ai/providers/openai-provider";
import { ProviderRegistry } from "@/lib/ai/providers/provider-registry";

export function createProviderRegistry(config: AiConfig) {
  return new ProviderRegistry({
    openai: new OpenAiProvider(config.openai.apiKey, config.openai.model),
    anthropic: new AnthropicProvider(config.anthropic.apiKey, config.anthropic.model),
    gemini: new GeminiProvider(config.gemini.apiKey, config.gemini.model),
  });
}
