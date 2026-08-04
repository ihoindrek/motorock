import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";

export class ProviderRegistry {
  constructor(private readonly providers: Record<string, AiProvider>) {}

  get(name: string) {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`Unknown AI provider: ${name}`);
    }

    return provider;
  }
}
