import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";
import { parseCommerceAiRunRequestBody } from "@/lib/commerce-ai/validation/run-request";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitKey = `commerce-ai:${clientRateLimitKey(request)}`;
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

  const parsed = parseCommerceAiRunRequestBody(body);
  if (!parsed) {
    return Response.json({ ok: false, error: "Invalid commerce AI run request" }, { status: 400 });
  }

  const { engine } = createCommerceAiContainer();

  try {
    const result = await engine.run(parsed);
    const status = result.ok ? 200 : result.code === "not_implemented" ? 501 : 422;

    return Response.json(result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Commerce AI run failed";

    return Response.json(
      { ok: false, error: message, code: "internal_error" },
      { status: 500 },
    );
  }
}
