import type { z } from "zod";
import { AiEngineError } from "@/lib/ai/core/errors";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

const MAX_ATTEMPTS = 3;

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

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
        "OPENAI_API_KEY is not configured",
        "not_configured",
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: input.model || this.defaultModel,
            temperature: input.temperature ?? 0.4,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: input.system },
              { role: "user", content: input.user },
            ],
          }),
        });

        const payload = (await response.json()) as OpenAiChatResponse;

        if (!response.ok) {
          throw new AiEngineError(
            payload.error?.message ?? `OpenAI HTTP ${response.status}`,
            "provider_error",
          );
        }

        const content = payload.choices?.[0]?.message?.content;
        if (!content) {
          throw new AiEngineError("OpenAI returned empty content", "provider_error");
        }

        const json = JSON.parse(content) as unknown;
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
                promptTokens: payload.usage.prompt_tokens ?? 0,
                completionTokens: payload.usage.completion_tokens ?? 0,
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
      : new AiEngineError("OpenAI request failed", "provider_error");
  }

  getDefaultModel() {
    return this.defaultModel;
  }
}
