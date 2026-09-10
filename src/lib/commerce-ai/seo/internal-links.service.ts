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
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog/posts";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

const InternalLinksOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        anchorText: z.string().min(3).max(120),
        url: z.string().min(2).max(300),
        targetTitle: z.string().max(200).optional(),
        reason: z.string().max(300).optional(),
      }),
    )
    .max(5),
});

export type InternalLinkSuggestion = {
  anchorText: string;
  url: string;
  targetTitle?: string;
  reason?: string;
};

export type InternalLinksPostResult = {
  postSlug: string;
  postTitle: string;
  suggestions: InternalLinkSuggestion[];
  skippedReason?: string;
};

export type InternalLinksJobResult = {
  ok: boolean;
  dryRun: true;
  locale: Locale;
  posts: InternalLinksPostResult[];
  warnings?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
};

export type InternalLinksTarget = {
  postSlug?: string;
  limit?: number;
};

function htmlToPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export class InternalLinksService {
  constructor(
    private readonly deps: {
      config: AiConfig;
      providerRegistry: ProviderRegistry;
    },
  ) {}

  async suggest(input: {
    jobId: string;
    locale: Locale;
    target: InternalLinksTarget;
    options?: { provider?: "openai" | "anthropic" | "gemini" };
  }): Promise<InternalLinksJobResult> {
    const started = Date.now();
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const warnings: string[] = [];

    // Resolve which posts to analyze.
    let postSlugs: string[];
    if (input.target.postSlug) {
      postSlugs = [input.target.postSlug];
    } else {
      const limit = Math.min(Math.max(input.target.limit ?? 5, 1), 10);
      const all = await getAllBlogPosts(input.locale);
      postSlugs = all.slice(0, limit).map((post) => post.slug);
    }

    if (postSlugs.length === 0) {
      return {
        ok: false,
        dryRun: true,
        locale: input.locale,
        posts: [],
        warnings: ["No blog posts found to analyze."],
        durationMs: Date.now() - started,
      };
    }

    const inventory = await fetchSiteLinkInventory(input.locale, {
      productLimit: 80,
      postLimit: 20,
    });

    if (inventory.length === 0) {
      throw new AiEngineError("Site link inventory is empty", "inventory_unavailable");
    }

    const allowedUrls = new Set(inventory.map((link) => link.url));
    const template = getPromptTemplate("internal_links.v1");
    const provider = this.deps.providerRegistry.get(providerName);
    const model = resolveActiveModel(providerName, this.deps.config);
    const inventoryText = formatLinkInventoryForPrompt(inventory);

    const posts: InternalLinksPostResult[] = [];
    let resolvedModel = model;

    for (const slug of postSlugs) {
      const post = await getBlogPostBySlug(slug, input.locale);

      if (!post?.contentHtml) {
        posts.push({
          postSlug: slug,
          postTitle: post?.title ?? slug,
          suggestions: [],
          skippedReason: "Post not found or has no content",
        });
        continue;
      }

      const plainText = htmlToPlainText(post.contentHtml).slice(0, 6000);
      const rendered = renderPromptTemplate(template, {
        locale: input.locale,
        postTitle: post.title,
        postText: plainText,
        linkInventory: inventoryText,
      });

      const { data, model: usedModel } = await provider.completeJson({
        model,
        system: rendered.system,
        user: rendered.user,
        schema: InternalLinksOutputSchema,
      });
      resolvedModel = usedModel;

      const seenUrls = new Set<string>();
      const suggestions = data.suggestions.filter((suggestion) => {
        if (!allowedUrls.has(suggestion.url)) {
          return false;
        }
        if (!plainText.includes(suggestion.anchorText)) {
          return false;
        }
        // Already linked to this target in the post.
        if (post.contentHtml.includes(`href="${suggestion.url}"`)) {
          return false;
        }
        if (seenUrls.has(suggestion.url)) {
          return false;
        }
        seenUrls.add(suggestion.url);
        return true;
      });

      posts.push({
        postSlug: post.slug,
        postTitle: post.title,
        suggestions,
      });
    }

    logStorefrontEvent("commerce-ai.internal_links", {
      jobId: input.jobId,
      locale: input.locale,
      posts: posts.length,
      suggestions: posts.reduce((sum, entry) => sum + entry.suggestions.length, 0),
    });

    return {
      ok: true,
      dryRun: true,
      locale: input.locale,
      posts,
      warnings: warnings.length > 0 ? warnings : undefined,
      provider: providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }
}
