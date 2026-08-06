import { AiEngineError } from "@/lib/ai/core/errors";
import type { RelatedProductsWritePayload } from "@/lib/commerce-ai/catalog/schemas";

export type RelatedProductsWriteResult = {
  ok: boolean;
  productId: number;
  locale: "en" | "et";
  relatedSlugs: string[];
};

export interface RelatedProductsWriteRepository {
  write(payload: RelatedProductsWritePayload): Promise<RelatedProductsWriteResult>;
}

export class WpRelatedProductsWriteRepository implements RelatedProductsWriteRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string | null,
  ) {}

  async write(payload: RelatedProductsWritePayload): Promise<RelatedProductsWriteResult> {
    if (!this.baseUrl || !this.secret) {
      throw new AiEngineError(
        "WOOCOMMERCE_STORE_URL or MOTOROCK_AI_WRITE_SECRET is not configured",
        "not_configured",
      );
    }

    const endpoint = new URL("/wp-json/motorock/v1/ai/write-related", this.baseUrl);

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Motorock-AI-Secret": this.secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json()) as RelatedProductsWriteResult & {
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      throw new AiEngineError(
        body.message ?? `WordPress related products write failed (${response.status})`,
        "write_failed",
      );
    }

    return body;
  }
}
