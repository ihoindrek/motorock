import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import type { ProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { fetchBlogProductSuggestions } from "@/lib/commerce-ai/blog/blog-product-suggestions";
import { buildBlogPromptVariables } from "@/lib/commerce-ai/blog/build-blog-prompt-variables";
import {
  BlogArticleOutputSchema,
  type BlogGenerateJobResult,
  type BlogGenerateTarget,
} from "@/lib/commerce-ai/blog/schemas";
import { validateBlogArticleOutput } from "@/lib/commerce-ai/blog/validate-blog-output";
import type { BlogWriteRepository } from "@/lib/commerce-ai/blog/wp-blog-write.repository";
import type { Locale } from "@/i18n/config";
import { revalidateStorefront } from "@/lib/revalidate/storefront";
import { logStorefrontEvent } from "@/lib/monitoring/observability";

type BlogGenerateServiceDeps = {
  config: AiConfig;
  providerRegistry: ProviderRegistry;
  productRead: ProductReadRepository;
  blogWrite: BlogWriteRepository;
};

export class BlogGenerateService {
  constructor(private readonly deps: BlogGenerateServiceDeps) {}

  async generate(input: {
    jobId: string;
    locale: Locale;
    target: BlogGenerateTarget;
    options?: {
      dryRun?: boolean;
      provider?: "openai" | "anthropic" | "gemini";
      publishStatus?: "draft" | "published";
      revalidate?: boolean;
    };
  }): Promise<BlogGenerateJobResult> {
    const started = Date.now();
    const dryRun = input.options?.dryRun ?? this.deps.config.dryRun;
    const publishStatus = input.options?.publishStatus ?? "draft";
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const requestedProductId = input.target.productId;
    const product = requestedProductId
      ? await this.deps.productRead.getById(requestedProductId, input.locale)
      : null;
    const warnings: string[] = [];

    if (requestedProductId && !product) {
      const hasTopicOrBrief = Boolean(input.target.topic?.trim() || input.target.brief?.trim());

      if (!hasTopicOrBrief) {
        return {
          ok: false,
          dryRun,
          locale: input.locale,
          validationErrors: [
            `Product ${requestedProductId} not found. Use the numeric WooCommerce product ID from the product edit URL (post=12345), or add a Topic/Brief instead.`,
          ],
          durationMs: Date.now() - started,
        };
      }

      warnings.push(
        `Product ${requestedProductId} was not found — generating without product context. Check the ID in WooCommerce (Products → edit → URL post=…).`,
      );
    }

    const productSuggestions = input.target.categorySlug
      ? await fetchBlogProductSuggestions({
          locale: input.locale,
          categorySlug: input.target.categorySlug,
          limit: 6,
        })
      : [];

    if (input.target.categorySlug && productSuggestions.length === 0) {
      warnings.push(
        `No products found for category "${input.target.categorySlug}" — the article will not include catalog recommendations. Check the WooCommerce category slug.`,
      );
    }

    const template = getPromptTemplate("blog.v1");
    const variables = buildBlogPromptVariables({
      locale: input.locale,
      target: input.target,
      product,
      productSuggestions,
    });
    const rendered = renderPromptTemplate(template, variables);
    const provider = this.deps.providerRegistry.get(providerName);
    const model = resolveActiveModel(providerName, this.deps.config);

    const { data, model: resolvedModel } = await provider.completeJson({
      model,
      system: rendered.system,
      user: rendered.user,
      schema: BlogArticleOutputSchema,
    });

    const validation = validateBlogArticleOutput(data);
    if (!validation.ok) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        preview: data,
        validationErrors: validation.errors,
        provider: providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    if (dryRun) {
      logStorefrontEvent("commerce-ai.blog_generate", {
        jobId: input.jobId,
        locale: input.locale,
        dryRun: true,
        ok: true,
      });

      return {
        ok: true,
        dryRun: true,
        locale: input.locale,
        preview: data,
        slug: data.slugSuggestion,
        warnings: warnings.length > 0 ? warnings : undefined,
        provider: providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    const writeResult = await this.deps.blogWrite.write({
      locale: input.locale,
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.contentHtml,
      slug: data.slugSuggestion,
      categorySlugs: data.categorySlugs,
      publishStatus,
      meta: {
        provider: providerName,
        model: resolvedModel,
        generatedAt: new Date().toISOString(),
        jobId: input.jobId,
        promptVersion: "blog.v1",
      },
    });

    const shouldRevalidate =
      (input.options?.revalidate ?? publishStatus === "published") && writeResult.ok;

    if (shouldRevalidate) {
      revalidateStorefront();
    }

    logStorefrontEvent("commerce-ai.blog_generate", {
      jobId: input.jobId,
      locale: input.locale,
      dryRun: false,
      ok: writeResult.ok,
      postId: writeResult.postId,
    });

    return {
      ok: writeResult.ok,
      dryRun: false,
      locale: input.locale,
      preview: data,
      postId: writeResult.postId,
      slug: writeResult.slug,
      editUrl: writeResult.editUrl,
      warnings: warnings.length > 0 ? warnings : undefined,
      provider: providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }
}
