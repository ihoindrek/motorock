import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { createAiContainer } from "@/lib/ai/core/container";
import { AiEngineError } from "@/lib/ai/core/errors";
import { mapAiEngineErrorResponse } from "@/lib/ai/api/error-response";
import { parseAiBatchRequestBody } from "@/lib/ai/validation/schemas";

export const dynamic = "force-dynamic";

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

  const { engine } = createAiContainer();

  try {
    const result = await engine.generateBatch(parsed);
    const status = result.succeeded > 0 ? 200 : 422;
    return Response.json(result, { status });
  } catch (error) {
    if (error instanceof AiEngineError) {
      return mapAiEngineErrorResponse(error);
    }

    throw error;
  }
}
