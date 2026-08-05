import type { AiOverwriteStrategy } from "@/lib/ai/core/types";

export type AiProviderName = "openai" | "anthropic" | "gemini";

export type AiConfig = {
  dryRun: boolean;
  apiSecret: string | null;
  wpWriteUrl: string;
  wpWriteSecret: string | null;
  defaultProvider: AiProviderName;
  defaultOverwrite: AiOverwriteStrategy;
  openai: {
    apiKey: string | null;
    model: string;
  };
  anthropic: {
    apiKey: string | null;
    model: string;
  };
  gemini: {
    apiKey: string | null;
    model: string;
  };
};

export function isProviderConfigured(
  provider: AiProviderName,
  config: AiConfig = getAiConfig(),
) {
  switch (provider) {
    case "anthropic":
      return Boolean(config.anthropic.apiKey);
    case "openai":
      return Boolean(config.openai.apiKey);
    case "gemini":
      return Boolean(config.gemini.apiKey);
  }
}

export function isAiConfigured(config: AiConfig = getAiConfig()) {
  if (!config.apiSecret) {
    return false;
  }

  return isProviderConfigured(config.defaultProvider, config);
}

export function getAiConfig(): AiConfig {
  return {
    dryRun: process.env.AI_DRY_RUN === "true",
    apiSecret: process.env.AI_API_SECRET?.trim() || null,
    wpWriteUrl: process.env.WOOCOMMERCE_STORE_URL?.replace(/\/$/, "") ?? "",
    wpWriteSecret: process.env.MOTOROCK_AI_WRITE_SECRET?.trim() || null,
    defaultProvider: parseProvider(process.env.AI_DEFAULT_PROVIDER),
    defaultOverwrite: parseOverwrite(process.env.AI_DEFAULT_OVERWRITE),
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim() || null,
      model: process.env.AI_OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
      model: process.env.AI_ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6",
    },
    gemini: {
      apiKey:
        process.env.GEMINI_API_KEY?.trim() ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
        null,
      model: process.env.AI_GEMINI_MODEL?.trim() || "gemini-2.0-flash",
    },
  };
}

function parseProvider(value: string | undefined): AiProviderName {
  if (
    value === "openai" ||
    value === "anthropic" ||
    value === "gemini"
  ) {
    return value;
  }

  return "anthropic";
}

function parseOverwrite(value: string | undefined): AiOverwriteStrategy {
  if (value === "always" || value === "never") {
    return value;
  }

  return "if_empty";
}

export function resolveActiveModel(
  provider: AiProviderName,
  config: AiConfig = getAiConfig(),
) {
  switch (provider) {
    case "openai":
      return config.openai.model;
    case "gemini":
      return config.gemini.model;
    case "anthropic":
    default:
      return config.anthropic.model;
  }
}

export function listConfiguredProviders(config: AiConfig = getAiConfig()) {
  const providers: AiProviderName[] = ["openai", "anthropic", "gemini"];
  return providers.filter((provider) => isProviderConfigured(provider, config));
}
