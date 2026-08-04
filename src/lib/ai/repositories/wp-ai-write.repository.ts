import { AiEngineError } from "@/lib/ai/core/errors";
import type { AiWritePayload } from "@/lib/ai/validation/schemas";

export type AiWriteResult = {
  ok: boolean;
  productId: number;
  locale: "en" | "et";
  written: {
    shortDescription?: boolean;
    description?: boolean;
    seoTitle?: boolean;
    seoMetaDescription?: boolean;
    seoKeywords?: boolean;
  };
};

export interface ProductWriteRepository {
  write(payload: AiWritePayload): Promise<AiWriteResult>;
}

export class WpAiWriteRepository implements ProductWriteRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string | null,
  ) {}

  async write(payload: AiWritePayload): Promise<AiWriteResult> {
    if (!this.baseUrl || !this.secret) {
      throw new AiEngineError(
        "WOOCOMMERCE_STORE_URL or MOTOROCK_AI_WRITE_SECRET is not configured",
        "not_configured",
      );
    }

    const endpoint = new URL("/wp-json/motorock/v1/ai/write", this.baseUrl);

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Motorock-AI-Secret": this.secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json()) as AiWriteResult & {
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      throw new AiEngineError(
        body.message ?? `WordPress write failed (${response.status})`,
        "write_failed",
      );
    }

    return body;
  }
}
