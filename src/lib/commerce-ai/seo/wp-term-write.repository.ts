import { AiEngineError } from "@/lib/ai/core/errors";
import type { TermWriteRepository } from "@/lib/commerce-ai/seo/category-content.service";
import type { Locale } from "@/i18n/config";

export class WpTermWriteRepository implements TermWriteRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string | null,
  ) {}

  async writeTermDescription(payload: {
    taxonomy: string;
    termSlug: string;
    locale: Locale;
    description: string;
    seoTitle?: string;
    seoMetaDescription?: string;
    meta: Record<string, string>;
  }): Promise<{ ok: boolean; termId: number }> {
    if (!this.baseUrl || !this.secret) {
      throw new AiEngineError(
        "WOOCOMMERCE_STORE_URL or MOTOROCK_AI_WRITE_SECRET is not configured",
        "not_configured",
      );
    }

    const endpoint = new URL("/wp-json/motorock/v1/ai/write-term", this.baseUrl);

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Motorock-AI-Secret": this.secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json()) as {
      ok?: boolean;
      termId?: number;
      message?: string;
    };

    if (!response.ok) {
      throw new AiEngineError(
        body.message ?? `WordPress term write failed (${response.status})`,
        "write_failed",
      );
    }

    return { ok: Boolean(body.ok), termId: body.termId ?? 0 };
  }
}
