import type { AiOverwriteStrategy } from "@/lib/ai/core/types";

export type AiProviderName = "openai" | "anthropic";

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
};

export function isAiConfigured(config: AiConfig = getAiConfig()) {
  if (!config.apiSecret) {
    return false;
  }

  if (config.defaultProvider === "anthropic") {
    return Boolean(config.anthropic.apiKey);
  }

  return Boolean(config.openai.apiKey);
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
  };
}

function parseProvider(value: string | undefined): AiProviderName {
  if (value === "openai" || value === "anthropic") {
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

export function resolveActiveModel(config: AiConfig) {
  return config.defaultProvider === "anthropic"
    ? config.anthropic.model
    : config.openai.model;
}
