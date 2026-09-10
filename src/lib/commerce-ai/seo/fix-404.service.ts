import { z } from "zod";
import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import {
  isIgnorableBrokenUrl,
  suggestRuleBasedRedirect,
} from "@/lib/commerce-ai/seo/fix-404-rules";
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
    .max(30),
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
  warnings?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
};

export type Fix404Target = {
  /** Broken URLs — one per line or as array. */
  urls?: string | string[];
};

const MAX_URLS = 100;
const AI_BATCH_SIZE = 25;

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

  return normalized.slice(0, MAX_URLS);
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
    const warnings: string[] = [];
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

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
      postLimit: 40,
    });

    if (inventory.length === 0) {
      throw new AiEngineError("Site link inventory is empty", "not_configured");
    }

    const allowedUrls = new Set(inventory.map((link) => link.url));
    const redirects: RedirectSuggestion[] = [];
    const matchedFrom = new Set<string>();

    // Pass 1: rule-based matching (fast, no AI).
    for (const from of brokenUrls) {
      if (isIgnorableBrokenUrl(from)) {
        matchedFrom.add(from);
        continue;
      }

      const ruleMatch = suggestRuleBasedRedirect(from, input.locale, inventory);
      if (ruleMatch) {
        // Rule-based targets come from our route helpers — do not require catalog inventory match.
        redirects.push(ruleMatch);
        matchedFrom.add(from);
      }
    }

    const remainingForAi = brokenUrls.filter((url) => !matchedFrom.has(url));

    // Pass 2: AI for remaining URLs (in batches).
    let resolvedModel: string | undefined;

    if (remainingForAi.length > 0 && isProviderConfigured(providerName, this.deps.config)) {
      const template = getPromptTemplate("fix_404.v1");
      const provider = this.deps.providerRegistry.get(providerName);
      const model = resolveActiveModel(providerName, this.deps.config);

      for (let offset = 0; offset < remainingForAi.length; offset += AI_BATCH_SIZE) {
        const batch = remainingForAi.slice(offset, offset + AI_BATCH_SIZE);
        const rendered = renderPromptTemplate(template, {
          locale: input.locale,
          brokenUrls: batch.join("\n"),
          linkInventory: formatLinkInventoryForPrompt(inventory),
        });

        try {
          const { data, model: usedModel } = await provider.completeJson({
            model,
            system: rendered.system,
            user: rendered.user,
            schema: Fix404OutputSchema,
          });
          resolvedModel = usedModel;

          for (const entry of data.redirects) {
            if (!allowedUrls.has(entry.to) || !batch.includes(entry.from)) {
              continue;
            }
            if (matchedFrom.has(entry.from)) {
              continue;
            }
            redirects.push(entry);
            matchedFrom.add(entry.from);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI batch failed";
          warnings.push(`AI batch failed (${batch.length} URLs): ${message}`);
          break;
        }
      }
    } else if (remainingForAi.length > 0) {
      warnings.push("AI provider not configured — only rule-based matches returned.");
    }

    const unmatched = brokenUrls.filter((url) => !matchedFrom.has(url));

    if (brokenUrls.length >= MAX_URLS) {
      warnings.push(`Only the first ${MAX_URLS} unique URLs were processed.`);
    }

    logStorefrontEvent("commerce-ai.fix_404", {
      jobId: input.jobId,
      locale: input.locale,
      inputCount: brokenUrls.length,
      suggested: redirects.length,
      ruleBased: redirects.filter((r) => !r.reason?.includes("AI")).length,
    });

    return {
      ok: redirects.length > 0 || unmatched.length > 0,
      dryRun: true,
      locale: input.locale,
      inputCount: brokenUrls.length,
      redirects,
      unmatched,
      warnings: warnings.length > 0 ? warnings : undefined,
      provider: providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }
}
