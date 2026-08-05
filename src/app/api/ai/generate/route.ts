import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { createAiContainer } from "@/lib/ai/core/container";
import { AiEngineError } from "@/lib/ai/core/errors";
import { mapAiEngineErrorResponse } from "@/lib/ai/api/error-response";
import {
  parseAiGenerateRequestBody,
  parseLocale,
} from "@/lib/ai/validation/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitKey = `ai:${clientRateLimitKey(request)}`;
  if (isRateLimited(rateLimitKey)) {
    return Response.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseAiGenerateRequestBody(body);
  if (!parsed) {
    return Response.json({ ok: false, error: "Invalid generate request" }, { status: 400 });
  }

  const { engine } = createAiContainer();

  try {
    const result = await engine.generate({
      productId: parsed.productId,
      locale: parsed.locale,
      sections: parsed.sections,
      options: parsed.options,
    });

    const status = result.ok ? 200 : 422;
    return Response.json(result, { status });
  } catch (error) {
    if (error instanceof AiEngineError) {
      return mapAiEngineErrorResponse(error);
    }

    throw error;
  }
}

export async function GET(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get("productId"));
  const locale = parseLocale(url.searchParams.get("locale"));

  if (!Number.isInteger(productId) || productId <= 0 || !locale) {
    return Response.json(
      { ok: false, error: "productId and locale query params are required" },
      { status: 400 },
    );
  }

  return POST(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        productId,
        locale,
        sections: ["description"],
        options: { dryRun: true },
      }),
    }),
  );
}
