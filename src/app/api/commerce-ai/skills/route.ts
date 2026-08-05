import { verifyAiRouteAuth } from "@/lib/ai/api/route-auth";
import { createCommerceAiContainer } from "@/lib/commerce-ai/core/container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = verifyAiRouteAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { engine } = createCommerceAiContainer();

  return Response.json({
    ok: true,
    skills: engine.listSkills(),
  });
}
