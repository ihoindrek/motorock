import { z } from "zod";
import type { AiConfig } from "@/lib/ai/config";
import { isProviderConfigured, resolveActiveModel } from "@/lib/ai/config";
import { AiEngineError } from "@/lib/ai/core/errors";
import { getPromptTemplate } from "@/lib/ai/prompts/templates";
import { renderPromptTemplate } from "@/lib/ai/prompts/prompt-renderer";
import type { ProviderRegistry } from "@/lib/ai/providers/provider-registry";
import { findForbiddenHtmlTags, sanitizeHtmlForAiOutput } from "@/lib/ai/validation/html-safety";
import { matchesLocaleHeuristic } from "@/lib/ai/domain/locale-heuristic";
import {
  fetchCategoryProductContext,
  formatProductSuggestionsForPrompt,
} from "@/lib/commerce-ai/blog/blog-product-suggestions";
import {
  collectStorefrontBrandsFromProducts,
  formatBrandListForPrompt,
  storefrontBrandNames,
} from "@/lib/commerce-ai/seo/category-brand-context";
import type { Locale } from "@/i18n/config";
import { graphqlRequest } from "@/lib/graphql/client";
import { listGraphqlTranslations } from "@/lib/graphql/wpml";
import { logStorefrontEvent } from "@/lib/monitoring/observability";
import { revalidateStorefront } from "@/lib/revalidate/storefront";

export const CategoryContentOutputSchema = z.object({
  descriptionHtml: z.string().min(80).max(700),
  seoTitle: z.string().min(10).max(58),
  metaDescription: z.string().min(50).max(160),
});

const CATEGORY_DESCRIPTION_MAX_WORDS = 75;

export type CategoryContentTarget = {
  categorySlug: string;
  bothLocales?: boolean;
};

export type CategoryContentJobResult = {
  ok: boolean;
  dryRun: boolean;
  locale: Locale;
  categorySlug: string;
  categoryName?: string;
  descriptionHtml?: string;
  seoTitle?: string;
  metaDescription?: string;
  termId?: number;
  validationErrors?: string[];
  warnings?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
  pair?: CategoryContentJobResult;
};

export interface TermWriteRepository {
  writeTermDescription(payload: {
    taxonomy: string;
    termSlug: string;
    locale: Locale;
    description: string;
    seoTitle?: string;
    seoMetaDescription?: string;
    meta: Record<string, string>;
  }): Promise<{ ok: boolean; termId: number }>;
}

function countWords(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

const CATEGORY_QUERY = `
  query CategoryContentContext($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      description
      count
      languageCode
      parent {
        node {
          name
        }
      }
      translations {
        name
        description
        slug
        language {
          code
        }
      }
    }
  }
`;

type CategoryNode = {
  databaseId?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  count?: number | null;
  languageCode?: string;
  parent?: { node?: { name?: string } } | null;
  translations?: Array<{
    name?: string;
    description?: string | null;
    slug?: string;
    language?: { code?: string } | null;
  } | null> | null;
};

type CategoryContentOptions = {
  dryRun?: boolean;
  provider?: "openai" | "anthropic" | "gemini";
  revalidate?: boolean;
};

export class CategoryContentService {
  constructor(
    private readonly deps: {
      config: AiConfig;
      providerRegistry: ProviderRegistry;
      termWrite: TermWriteRepository;
    },
  ) {}

  async generate(input: {
    jobId: string;
    locale: Locale;
    target: CategoryContentTarget;
    options?: CategoryContentOptions;
  }): Promise<CategoryContentJobResult> {
    const providerName = input.options?.provider ?? this.deps.config.defaultProvider;

    if (!isProviderConfigured(providerName, this.deps.config)) {
      throw new AiEngineError(
        `AI provider "${providerName}" is not configured`,
        "not_configured",
      );
    }

    const primary = await this.generateForLocale({
      ...input,
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
    });

    return { ...primary, pair: secondary };
  }

  private async generateForLocale(input: {
    jobId: string;
    locale: Locale;
    target: CategoryContentTarget;
    options?: CategoryContentOptions;
    providerName: "openai" | "anthropic" | "gemini";
  }): Promise<CategoryContentJobResult> {
    const started = Date.now();
    const dryRun = input.options?.dryRun ?? this.deps.config.dryRun;
    const warnings: string[] = [];

    const category = await this.fetchCategory(input.target.categorySlug, input.locale);

    if (!category) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        categorySlug: input.target.categorySlug,
        validationErrors: [
          `Category "${input.target.categorySlug}" was not found in WooCommerce.`,
        ],
        durationMs: Date.now() - started,
      };
    }

    const productContext = await fetchCategoryProductContext({
      locale: input.locale,
      categorySlug: input.target.categorySlug,
      limit: 8,
    });
    const { suggestions, brandProducts } = productContext;
    const brandsInCategory = collectStorefrontBrandsFromProducts(brandProducts);

    if (suggestions.length === 0) {
      warnings.push("No sample products found — content is generated from the category name only.");
    }

    if (brandsInCategory.length === 0) {
      warnings.push("No storefront brands detected in this category — brand names will be omitted.");
    }

    const template = getPromptTemplate("category_content.v2");
    const rendered = renderPromptTemplate(template, {
      locale: input.locale,
      categoryName: category.name,
      categoryPath: category.parentName
        ? `${category.parentName} > ${category.name}`
        : category.name,
      productCount: String(category.count),
      existingDescription: category.existingDescription.slice(0, 400),
      allowedBrands: formatBrandListForPrompt(storefrontBrandNames()),
      brandsInCategory: formatBrandListForPrompt(brandsInCategory),
      productCatalog: formatProductSuggestionsForPrompt(suggestions),
    });

    const provider = this.deps.providerRegistry.get(input.providerName);
    const model = resolveActiveModel(input.providerName, this.deps.config);

    const { data, model: resolvedModel } = await provider.completeJson({
      model,
      system: rendered.system,
      user: rendered.user,
      schema: CategoryContentOutputSchema,
    });

    const descriptionHtml = sanitizeHtmlForAiOutput(data.descriptionHtml);
    const seoTitle = data.seoTitle.trim();
    const metaDescription = data.metaDescription.replace(/\s+/g, " ").trim();
    const validationErrors: string[] = [];

    const forbidden = findForbiddenHtmlTags(descriptionHtml);
    if (forbidden.length > 0) {
      validationErrors.push(`Forbidden HTML tags: ${forbidden.join(", ")}`);
    }

    const plain = descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = countWords(descriptionHtml);
    if (wordCount > CATEGORY_DESCRIPTION_MAX_WORDS) {
      validationErrors.push(
        `Intro text is too long (${wordCount} words; max ${CATEGORY_DESCRIPTION_MAX_WORDS})`,
      );
    }

    if (!matchesLocaleHeuristic(plain, input.locale)) {
      validationErrors.push(
        `Generated text does not look like ${input.locale.toUpperCase()} content`,
      );
    }

    if (seoTitle.length > 58) {
      validationErrors.push(`SEO title is too long (${seoTitle.length} characters; max 58)`);
    }

    if (metaDescription.length > 160) {
      validationErrors.push(
        `Meta description is too long (${metaDescription.length} characters; max 160)`,
      );
    }

    if (validationErrors.length > 0) {
      return {
        ok: false,
        dryRun,
        locale: input.locale,
        categorySlug: input.target.categorySlug,
        categoryName: category.name,
        descriptionHtml,
        seoTitle,
        metaDescription,
        validationErrors,
        provider: input.providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    if (!dryRun) {
      const writeResult = await this.deps.termWrite.writeTermDescription({
        taxonomy: "product_cat",
        termSlug: input.target.categorySlug,
        locale: input.locale,
        description: descriptionHtml,
        seoTitle,
        seoMetaDescription: metaDescription,
        meta: {
          provider: input.providerName,
          model: resolvedModel,
          generatedAt: new Date().toISOString(),
          jobId: input.jobId,
          promptVersion: "category_content.v2",
        },
      });

      if (input.options?.revalidate ?? true) {
        revalidateStorefront();
      }

      logStorefrontEvent("commerce-ai.category_content", {
        jobId: input.jobId,
        locale: input.locale,
        categorySlug: input.target.categorySlug,
        ok: writeResult.ok,
      });

      return {
        ok: writeResult.ok,
        dryRun: false,
        locale: input.locale,
        categorySlug: input.target.categorySlug,
        categoryName: category.name,
        descriptionHtml,
        seoTitle,
        metaDescription,
        termId: writeResult.termId,
        warnings: warnings.length > 0 ? warnings : undefined,
        provider: input.providerName,
        model: resolvedModel,
        durationMs: Date.now() - started,
      };
    }

    logStorefrontEvent("commerce-ai.category_content", {
      jobId: input.jobId,
      locale: input.locale,
      categorySlug: input.target.categorySlug,
      dryRun: true,
      ok: true,
    });

    return {
      ok: true,
      dryRun: true,
      locale: input.locale,
      categorySlug: input.target.categorySlug,
      categoryName: category.name,
      descriptionHtml,
      seoTitle,
      metaDescription,
      warnings: warnings.length > 0 ? warnings : undefined,
      provider: input.providerName,
      model: resolvedModel,
      durationMs: Date.now() - started,
    };
  }

  private async fetchCategory(slug: string, locale: Locale) {
    let node: CategoryNode | null | undefined;
    try {
      const data = await graphqlRequest<
        { productCategory?: CategoryNode | null },
        { slug: string }
      >(CATEGORY_QUERY, { slug }, { next: { revalidate: 0 } });
      node = data.productCategory;
    } catch {
      return null;
    }

    if (!node?.name) {
      return null;
    }

    const nodeLocale = node.languageCode?.toLowerCase();
    let name = node.name;
    let existingDescription = node.description ?? "";

    if (nodeLocale && nodeLocale !== locale) {
      const translation = listGraphqlTranslations(node.translations).find(
        (entry) => entry.language?.code?.toLowerCase() === locale,
      );
      if (translation?.name) {
        name = translation.name;
        existingDescription = translation.description ?? "";
      }
    }

    return {
      termId: node.databaseId ?? 0,
      name,
      parentName: node.parent?.node?.name ?? "",
      count: node.count ?? 0,
      existingDescription: existingDescription.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    };
  }
}
