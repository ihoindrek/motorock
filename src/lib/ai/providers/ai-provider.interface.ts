import type { z } from "zod";

export type AiCompletionUsage = {
  promptTokens: number;
  completionTokens: number;
};

export interface AiProvider {
  readonly name: string;
  completeJson<T>(input: {
    model: string;
    system: string;
    user: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<{
    data: T;
    model: string;
    usage?: AiCompletionUsage;
  }>;
}
