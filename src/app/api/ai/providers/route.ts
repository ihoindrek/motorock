import { verifyAiRouteSecret } from "@/lib/ai/api/route-auth";
import {
  getAiConfig,
  isProviderConfigured,
  listConfiguredProviders,
  resolveActiveModel,
  type AiProviderName,
} from "@/lib/ai/config";

export const dynamic = "force-dynamic";

const ALL_PROVIDERS: AiProviderName[] = ["openai", "anthropic", "gemini"];

export async function GET(request: Request) {
  const auth = verifyAiRouteSecret(request);
  if (!auth.ok) {
    return auth.response;
  }

  const config = getAiConfig();

  return Response.json({
    ok: true,
    defaultProvider: config.defaultProvider,
    configured: listConfiguredProviders(config),
    providers: ALL_PROVIDERS.map((name) => ({
      name,
      model: resolveActiveModel(name, config),
      configured: isProviderConfigured(name, config),
    })),
  });
}
