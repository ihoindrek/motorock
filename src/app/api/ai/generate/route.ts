import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { mapAiEngineErrorResponse } from "@/lib/ai/api/error-response";
import { AiEngineError } from "@/lib/ai/core/errors";
import { parseAiGenerateRequestBody } from "@/lib/ai/validation/schemas";
import { unwrapCommerceAiGenerateResult } from "@/lib/commerce-ai/api/legacy-response";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";

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

  const { engine } = createCommerceAiContainer();

  try {
    const commerceResult = await engine.run({
      skill: "product.content_writer",
      locale: parsed.locale,
      target: { productId: parsed.productId },
      options: {
        ...parsed.options,
        sections: parsed.sections,
      },
    });

    const result = unwrapCommerceAiGenerateResult(commerceResult);
    const status =
      "results" in result && result.ok
        ? 200
        : "code" in result && result.code === "not_implemented"
          ? 501
          : 422;

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
  const localeParam = url.searchParams.get("locale");

  if (!Number.isInteger(productId) || productId <= 0 || (localeParam !== "en" && localeParam !== "et")) {
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
        locale: localeParam,
        sections: ["description"],
        options: { dryRun: true },
      }),
    }),
  );
}
