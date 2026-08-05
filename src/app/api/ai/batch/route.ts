import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { mapAiEngineErrorResponse } from "@/lib/ai/api/error-response";
import { AiEngineError } from "@/lib/ai/core/errors";
import { parseAiBatchRequestBody } from "@/lib/ai/validation/schemas";
import { unwrapCommerceAiBatchResult } from "@/lib/commerce-ai/api/legacy-response";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitKey = `ai-batch:${clientRateLimitKey(request)}`;
  if (isRateLimited(rateLimitKey)) {
    return Response.json(
      { ok: false, error: "Too many batch requests. Try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseAiBatchRequestBody(body);
  if (!parsed) {
    return Response.json(
      {
        ok: false,
        error:
          "Invalid batch request (check productIds, locales, sections; max 25 products or 30 total jobs)",
      },
      { status: 400 },
    );
  }

  const { engine } = createCommerceAiContainer();

  try {
    const commerceResult = await engine.runBatch({
      skill: "product.content_writer",
      productIds: parsed.productIds,
      locales: parsed.locales,
      options: {
        ...parsed.options,
        sections: parsed.sections,
      },
    });

    const result = unwrapCommerceAiBatchResult(commerceResult);
    const status = result.succeeded > 0 ? 200 : 422;

    return Response.json(result, { status });
  } catch (error) {
    if (error instanceof AiEngineError) {
      return mapAiEngineErrorResponse(error);
    }

    throw error;
  }
}
