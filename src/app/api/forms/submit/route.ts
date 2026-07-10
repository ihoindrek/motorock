import { clientRateLimitKey, isRateLimited } from "@/lib/forms/rate-limit";
import { sendFormViaResend } from "@/lib/forms/send-via-resend";
import { parseFormSubmitPayload } from "@/lib/forms/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitKey = clientRateLimitKey(request);

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
    return Response.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const payload = parseFormSubmitPayload(body);

  if (!payload) {
    return Response.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  try {
    const result = await sendFormViaResend(payload);

    if (!result.ok) {
      return Response.json(result, { status: 503 });
    }

    return Response.json(result);
  } catch (error) {
    console.error("[forms] submit failed:", error);
    return Response.json(
      { ok: false, error: "Could not send message" },
      { status: 500 },
    );
  }
}
