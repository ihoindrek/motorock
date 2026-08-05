import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";
import { parseCommerceAiBatchRequestBody } from "@/lib/commerce-ai/validation/batch-request";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitKey = `commerce-ai-batch:${clientRateLimitKey(request)}`;
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

  const parsed = parseCommerceAiBatchRequestBody(body);
  if (!parsed) {
    return Response.json(
      {
        ok: false,
        error:
          "Invalid batch request (check skill, productIds, locales; max 25 products or 30 total jobs)",
      },
      { status: 400 },
    );
  }

  const { engine } = createCommerceAiContainer();
  const result = await engine.runBatch(parsed);
  const status = result.succeeded > 0 ? 200 : 422;

  return Response.json(result, { status });
}
