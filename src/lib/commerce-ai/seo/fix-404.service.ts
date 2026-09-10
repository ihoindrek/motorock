import { z } from "zod";
import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import {
  fetchSiteLinkInventory,
  formatLinkInventoryForPrompt,
} from "@/lib/commerce-ai/seo/site-link-inventory";
import type { Locale } from "@/i18n/config";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

const Fix404OutputSchema = z.object({
  redirects: z
    .array(
      z.object({
        from: z.string().min(2).max(300),
        to: z.string().min(2).max(300),
        targetTitle: z.string().max(200).optional(),
        confidence: z.enum(["high", "medium", "low"]),
        reason: z.string().max(300).optional(),
      }),
    )
    .max(50),
});

export type RedirectSuggestion = {
  from: string;
  to: string;
  targetTitle?: string;
  confidence: "high" | "medium" | "low";
  reason?: string;
};

export type Fix404JobResult = {
  ok: boolean;
  dryRun: true;
  locale: Locale;
  inputCount: number;
  redirects: RedirectSuggestion[];
  unmatched: string[];
  provider?: string;
  model?: string;
  durationMs: number;
};

export type Fix404Target = {
  /** Broken URLs — one per line or as array. */
  urls?: string | string[];
};

function normalizeBrokenUrls(input: Fix404Target["urls"]): string[] {
  const raw =
    typeof input === "string"
      ? input.split(/\r?\n/)
      : Array.isArray(input)
        ? input
        : [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const line of raw) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let path = trimmed;
    try {
      if (trimmed.startsWith("http")) {
        path = new URL(trimmed).pathname;
      }
    } catch {
      // Keep as-is if not a valid URL.
    }

    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    if (!seen.has(path)) {
      seen.add(path);
      normalized.push(path);
    }
  }

  return normalized.slice(0, 50);
}

export class Fix404Service {
  constructor(
    private readonly deps: {
      config: AiConfig;
      providerRegistry: ProviderRegistry;
    },
  ) {}

  async suggest(input: {
    jobId: string;
    locale: Locale;
    target: Fix404Target;
    options?: { provider?: "openai" | "anthropic" | "gemini" };
  }): Promise<Fix404JobResult> {
    const started = Date.now();
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const brokenUrls = normalizeBrokenUrls(input.target.urls);

    if (brokenUrls.length === 0) {
      return {
        ok: false,
        dryRun: true,
        locale: input.locale,
        inputCount: 0,
        redirects: [],
        unmatched: [],
        durationMs: Date.now() - started,
      };
    }

    const inventory = await fetchSiteLinkInventory(input.locale, {
      productLimit: 120,
      postLimit: 30,
    });

    if (inventory.length === 0) {
      throw new AiEngineError("Site link inventory is empty", "not_configured");
    }

    const allowedUrls = new Set(inventory.map((link) => link.url));
    const template = getPromptTemplate("fix_404.v1");
    const rendered = renderPromptTemplate(template, {
      locale: input.locale,
      brokenUrls: brokenUrls.join("\n"),
      linkInventory: formatLinkInventoryForPrompt(inventory),
    });

    const provider = this.deps.providerRegistry.get(providerName);
    const model = resolveActiveModel(providerName, this.deps.config);

    const { data, model: resolvedModel } = await provider.completeJson({
      model,
      system: rendered.system,
      user: rendered.user,
      schema: Fix404OutputSchema,
    });

    const matchedFrom = new Set<string>();
    const redirects = data.redirects.filter((entry) => {
      if (!allowedUrls.has(entry.to)) {
        return false;
      }
      if (!brokenUrls.includes(entry.from)) {
        return false;
      }
      matchedFrom.add(entry.from);
      return true;
    });

    const unmatched = brokenUrls.filter((url) => !matchedFrom.has(url));

    logStorefrontEvent("commerce-ai.fix_404", {
      jobId: input.jobId,
      locale: input.locale,
      inputCount: brokenUrls.length,
      suggested: redirects.length,
    });

    return {
      ok: true,
      dryRun: true,
      locale: input.locale,
      inputCount: brokenUrls.length,
      redirects,
      unmatched,
      provider: providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }
}
