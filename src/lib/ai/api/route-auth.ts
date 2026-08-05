import { getAiConfig, isAiConfigured } from "@/lib/ai/config";
import { verifyAiApiSecret } from "@/lib/ai/core/engine-auth";

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export function unauthorizedResponse() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export function verifyAiRouteAuth(request: Request) {
  const secretCheck = verifyAiRouteSecret(request);
  if (!secretCheck.ok) {
    return secretCheck;
  }

  const config = secretCheck.config;

  if (!isAiConfigured(config)) {
    return {
      ok: false as const,
      response: Response.json(
        {
          ok: false,
          error: "AI Engine is not fully configured (provider API key missing)",
        },
        { status: 503 },
      ),
    };
  }

  return { ok: true as const, config };
}

export function verifyAiRouteSecret(request: Request) {
  const config = getAiConfig();

  if (!config.apiSecret) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "AI_API_SECRET is not configured" },
        { status: 503 },
      ),
    };
  }

  const token = readBearerToken(request);
  if (!verifyAiApiSecret(token, config.apiSecret)) {
    return { ok: false as const, response: unauthorizedResponse() };
  }

  return { ok: true as const, config };
}
