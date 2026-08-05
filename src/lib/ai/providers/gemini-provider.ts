import type { z } from "zod";
import { AiEngineError } from "@/lib/ai/core/errors";
import type { AiProvider } from "@/lib/ai/providers/ai-provider.interface";
import { extractJsonBlock } from "@/lib/ai/providers/extract-json-block";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

const MAX_ATTEMPTS = 3;

export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

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
        "GEMINI_API_KEY is not configured",
        "not_configured",
      );
    }

    const model = input.model || this.defaultModel;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const url = new URL(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        );
        url.searchParams.set("key", this.apiKey);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: `${input.system}\n\nRespond with valid JSON only.` }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: input.user }],
              },
            ],
            generationConfig: {
              temperature: input.temperature ?? 0.4,
              responseMimeType: "application/json",
            },
          }),
        });

        const payload = (await response.json()) as GeminiGenerateResponse;

        if (!response.ok) {
          throw new AiEngineError(
            payload.error?.message ?? `Gemini HTTP ${response.status}`,
            "provider_error",
          );
        }

        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("\n")
          .trim();

        if (!text) {
          throw new AiEngineError("Gemini returned empty content", "provider_error");
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
          model,
          usage: payload.usageMetadata
            ? {
                promptTokens: payload.usageMetadata.promptTokenCount ?? 0,
                completionTokens: payload.usageMetadata.candidatesTokenCount ?? 0,
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
      : new AiEngineError("Gemini request failed", "provider_error");
  }
}
