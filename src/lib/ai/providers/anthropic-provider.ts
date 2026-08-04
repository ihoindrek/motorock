import type { z } from "zod";
import { AiEngineError } from "@/lib/ai/core/errors";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";

type AnthropicMessageResponse = {
  model?: string;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

const MAX_ATTEMPTS = 3;

function extractJsonBlock(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string | null,
    private readonly defaultModel: string,
  ) {}

  async completeJson<T>(input: {
    model: string;
    system: string;
    user: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }) {
    if (!this.apiKey) {
      throw new AiEngineError(
        "ANTHROPIC_API_KEY is not configured",
        "not_configured",
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model || this.defaultModel,
            max_tokens: 4096,
            temperature: input.temperature ?? 0.4,
            system: `${input.system}\n\nRespond with valid JSON only. No markdown fences.`,
            messages: [{ role: "user", content: input.user }],
          }),
        });

        const payload = (await response.json()) as AnthropicMessageResponse;

        if (!response.ok) {
          throw new AiEngineError(
            payload.error?.message ?? `Anthropic HTTP ${response.status}`,
            "provider_error",
          );
        }

        const text = payload.content
          ?.filter((block) => block.type === "text")
          .map((block) => block.text ?? "")
          .join("\n")
          .trim();

        if (!text) {
          throw new AiEngineError("Anthropic returned empty content", "provider_error");
        }

        const json = JSON.parse(extractJsonBlock(text)) as unknown;
        const parsed = input.schema.safeParse(json);
        if (!parsed.success) {
          throw new AiEngineError(
            parsed.error.issues.map((issue) => issue.message).join("; "),
            "validation_failed",
          );
        }

        return {
          data: parsed.data,
          model: payload.model ?? input.model,
          usage: payload.usage
            ? {
                promptTokens: payload.usage.input_tokens ?? 0,
                completionTokens: payload.usage.output_tokens ?? 0,
              }
            : undefined,
        };
      } catch (error) {
        lastError = error;
        if (error instanceof AiEngineError && error.code === "provider_error") {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new AiEngineError("Anthropic request failed", "provider_error");
  }

  getDefaultModel() {
    return this.defaultModel;
  }
}
