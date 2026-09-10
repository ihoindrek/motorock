import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import type { ProductReadRepository } from "@/lib/ai/repositories/graphql-product-read.repository";
import { fetchBlogProductSuggestions } from "@/lib/commerce-ai/blog/blog-product-suggestions";
import { buildBlogPromptVariables } from "@/lib/commerce-ai/blog/build-blog-prompt-variables";
import { fetchRecentArticleLinks } from "@/lib/commerce-ai/blog/recent-articles";
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

type BlogGenerateOptions = {
  dryRun?: boolean;
  provider?: "openai" | "anthropic" | "gemini";
  publishStatus?: "draft" | "published";
  revalidate?: boolean;
};

export class BlogGenerateService {
  constructor(private readonly deps: BlogGenerateServiceDeps) {}

  async generate(input: {
    jobId: string;
    locale: Locale;
    target: BlogGenerateTarget;
    options?: BlogGenerateOptions;
  }): Promise<BlogGenerateJobResult> {
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const primary = await this.generateForLocale({
      jobId: input.jobId,
      locale: input.locale,
      target: input.target,
      options: input.options,
      providerName,
    });

    if (!input.target.bothLocales || !primary.ok) {
      return primary;
    }

    const secondaryLocale: Locale = input.locale === "en" ? "et" : "en";

    const secondary = await this.generateForLocale({
      jobId: input.jobId,
      locale: secondaryLocale,
      target: input.target,
      options: input.options,
      providerName,
      pairWith: primary.preview
        ? {
            locale: input.locale,
            title: primary.preview.title,
            excerpt: primary.preview.excerpt,
          }
        : undefined,
      translationOfPostId: primary.postId,
    });

    return { ...primary, pair: secondary };
  }

  private async generateForLocale(input: {
    jobId: string;
    locale: Locale;
    target: BlogGenerateTarget;
    options?: BlogGenerateOptions;
    providerName: "openai" | "anthropic" | "gemini";
    pairWith?: { locale: Locale; title: string; excerpt: string };
    translationOfPostId?: number;
  }): Promise<BlogGenerateJobResult> {
    const started = Date.now();
    const dryRun = input.options?.dryRun ?? this.deps.config.dryRun;
    const publishStatus = input.options?.publishStatus ?? "draft";
    const providerName = input.providerName;

    const requestedProductId = input.target.productId;
    const product = requestedProductId
      ? await this.deps.productRead.getById(requestedProductId, input.locale)
      : null;
    const warnings: string[] = [];

    if (requestedProductId && !product) {
      const hasOtherContext = Boolean(
        input.target.topic?.trim() ||
          input.target.brief?.trim() ||
          input.target.categorySlug ||
          input.target.brandSlug ||
          input.pairWith,
      );

      if (!hasOtherContext) {
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

    const [productSuggestions, recentArticles] = await Promise.all([
      input.target.brandSlug || input.target.categorySlug
        ? fetchBlogProductSuggestions({
            locale: input.locale,
            brandSlug: input.target.brandSlug,
            categorySlug: input.target.categorySlug,
            limit: 6,
          })
        : Promise.resolve([]),
      fetchRecentArticleLinks(input.locale, 8),
    ]);

    if (
      (input.target.brandSlug || input.target.categorySlug) &&
      productSuggestions.length === 0
    ) {
      const scope = input.target.brandSlug
        ? `brand "${input.target.brandSlug}"`
        : `category "${input.target.categorySlug}"`;
      warnings.push(
        `No products found for ${scope} — the article will not include catalog recommendations.`,
      );
    }

    const template = getPromptTemplate("blog.v1");
    const variables = buildBlogPromptVariables({
      locale: input.locale,
      target: input.target,
      product,
      productSuggestions,
      recentArticles,
      pairWith: input.pairWith,
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

    const featuredImage =
      product?.images[0]?.url ??
      productSuggestions.find((suggestion) => suggestion.imageUrl)?.imageUrl;

    const writeResult = await this.deps.blogWrite.write({
      locale: input.locale,
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.contentHtml,
      slug: data.slugSuggestion,
      categorySlugs: data.categorySlugs,
      publishStatus,
      featuredImageUrl: featuredImage,
      featuredImageAlt: featuredImage ? data.title : undefined,
      translationOfPostId: input.translationOfPostId,
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
