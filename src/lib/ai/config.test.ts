import { describe, expect, it } from "vitest";
import {
  isProviderConfigured,
  listConfiguredProviders,
  resolveActiveModel,
  type AiConfig,
} from "@/lib/ai/config";

const baseConfig: AiConfig = {
  dryRun: false,
  apiSecret: "secret",
  wpWriteUrl: "https://shop.example",
  wpWriteSecret: "write-secret",
  defaultProvider: "anthropic",
  defaultOverwrite: "if_empty",
  openai: { apiKey: "openai-key", model: "gpt-4.1-mini" },
  anthropic: { apiKey: "anthropic-key", model: "claude-sonnet-4-6" },
  gemini: { apiKey: null, model: "gemini-2.0-flash" },
};

describe("AI provider config", () => {
  it("detects configured providers", () => {
    expect(isProviderConfigured("openai", baseConfig)).toBe(true);
    expect(isProviderConfigured("anthropic", baseConfig)).toBe(true);
    expect(isProviderConfigured("gemini", baseConfig)).toBe(false);
  });

  it("lists configured providers", () => {
    expect(listConfiguredProviders(baseConfig)).toEqual(["openai", "anthropic"]);
  });

  it("resolves model per provider", () => {
    expect(resolveActiveModel("gemini", baseConfig)).toBe("gemini-2.0-flash");
  });
});
