import { AiEngineError } from "@/lib/ai/core/errors";
import type { BlogWritePayload } from "@/lib/commerce-ai/blog/schemas";

export type BlogWriteResult = {
  ok: boolean;
  postId: number;
  slug: string;
  locale: "en" | "et";
  editUrl?: string;
};

export interface BlogWriteRepository {
  write(payload: BlogWritePayload): Promise<BlogWriteResult>;
}

export class WpBlogWriteRepository implements BlogWriteRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string | null,
  ) {}

  async write(payload: BlogWritePayload): Promise<BlogWriteResult> {
    if (!this.baseUrl || !this.secret) {
      throw new AiEngineError(
        "WOOCOMMERCE_STORE_URL or MOTOROCK_AI_WRITE_SECRET is not configured",
        "not_configured",
      );
    }

    const endpoint = new URL("/wp-json/motorock/v1/ai/write-post", this.baseUrl);

    const response = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Motorock-AI-Secret": this.secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json()) as BlogWriteResult & {
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      throw new AiEngineError(
        body.message ?? `WordPress blog write failed (${response.status})`,
        "write_failed",
      );
    }

    return body;
  }
}
