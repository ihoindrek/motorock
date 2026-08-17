import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import {
  commerceAiJson,
  commerceAiOptions,
  commerceAiResponse,
} from "@/lib/ai/api/admin-cors-response";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";
import { parseCommerceAiBatchRequestBody } from "@/lib/commerce-ai/validation/batch-request";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS(request: Request) {
  return commerceAiOptions(request);
}

export async function POST(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return commerceAiResponse(request, auth.response);
  }

  const rateLimitKey = `commerce-ai-batch:${clientRateLimitKey(request)}`;
  if (isRateLimited(rateLimitKey)) {
    return commerceAiJson(
      request,
      { ok: false, error: "Too many batch requests. Try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return commerceAiJson(request, { ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseCommerceAiBatchRequestBody(body);
  if (!parsed) {
    return commerceAiJson(
      request,
      {
        ok: false,
        error:
          "Invalid batch request (check skill, productIds, locales; max 25 products or 30 total jobs)",
      },
      { status: 400 },
    );
  }

  const { engine } = createCommerceAiContainer();

  try {
    const result = await engine.runBatch(parsed);
    const status = result.succeeded > 0 ? 200 : 422;

    return commerceAiJson(request, result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Commerce AI batch failed";

    return commerceAiJson(
      request,
      { ok: false, error: message, code: "internal_error" },
      { status: 500 },
    );
  }
}
