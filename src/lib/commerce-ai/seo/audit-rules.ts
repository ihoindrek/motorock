import type { Locale } from "@/i18n/config";
import {
  hasExistingAltTextContent,
  hasExistingDescriptionContent,
  hasExistingFaqContent,
  hasExistingSeoContent,
} from "@/lib/ai/domain/normalized-product";
import { toNormalizedProduct } from "@/lib/ai/repositories/normalize-product";
import type { GraphQLProduct } from "@/lib/graphql/types";
import type { GraphQLBlogPostCard } from "@/lib/graphql/types-blog";
import { isLocale } from "@/i18n/config";
import type {
  SeoAuditFinding,
  SeoAuditItemResult,
} from "@/lib/commerce-ai/seo/audit-types";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pushFinding(
  findings: SeoAuditFinding[],
  finding: SeoAuditFinding,
) {
  findings.push(finding);
}

export function auditProduct(product: GraphQLProduct, locale: Locale): SeoAuditItemResult {
  const normalized = toNormalizedProduct(product, locale);
  const findings: SeoAuditFinding[] = [];
  let score = 0;

  if (!hasExistingDescriptionContent(normalized.existing)) {
    const longPlain = stripHtml(normalized.existing.description ?? "");
    if (longPlain.length < 200) {
      score += 3;
      pushFinding(findings, {
        code: "description.missing",
        severity: "error",
        message: "Short or missing product description",
      });
    } else {
      score += 1;
      pushFinding(findings, {
        code: "description.weak",
        severity: "warning",
        message: "Product description is thin",
      });
    }
  }

  if (!hasExistingSeoContent(normalized.existing)) {
    score += 2;
    pushFinding(findings, {
      code: "seo.missing",
      severity: "error",
      message: "Missing AI SEO title or meta description",
    });
  } else {
    const metaLength = normalized.existing.seoMetaDescription?.trim().length ?? 0;
    if (metaLength > 160) {
      score += 1;
      pushFinding(findings, {
        code: "seo.meta_too_long",
        severity: "warning",
        message: "Meta description exceeds 160 characters",
      });
    }
  }

  if (!hasExistingFaqContent(normalized.existing)) {
    score += 1;
    pushFinding(findings, {
      code: "faq.missing",
      severity: "warning",
      message: "FAQ has fewer than 3 valid items",
    });
  }

  if (!hasExistingAltTextContent(normalized)) {
    score += 2;
    pushFinding(findings, {
      code: "alt_text.gap",
      severity: "error",
      message: "One or more product images lack adequate ALT text",
    });
  }

  if (normalized.images.length === 0) {
    score += 2;
    pushFinding(findings, {
      code: "image.missing",
      severity: "error",
      message: "Product has no primary or gallery images",
    });
  }

  if (normalized.existing.contentStatus === "draft") {
    score += 1;
    pushFinding(findings, {
      code: "content.draft_pending",
      severity: "info",
      message: "AI-generated content is still in draft status",
    });
  }

  const otherLocale: Locale = locale === "en" ? "et" : "en";
  if (!normalized.translations.some((entry) => entry.locale === otherLocale)) {
    score += 1;
    pushFinding(findings, {
      code: "translation.missing",
      severity: "warning",
      message: `Missing ${otherLocale.toUpperCase()} translation`,
    });
  }

  return {
    entityType: "product",
    databaseId: normalized.productId,
    slug: normalized.slug,
    title: normalized.name,
    seoTitle: normalized.existing.seoTitle,
    locale,
    score,
    findings,
  };
}

export function auditPost(post: GraphQLBlogPostCard, locale: Locale): SeoAuditItemResult {
  const findings: SeoAuditFinding[] = [];
  let score = 0;
  const title = post.title?.trim() ?? "";
  const excerptPlain = stripHtml(post.excerpt ?? "");

  if (title.length < 20) {
    score += 2;
    pushFinding(findings, {
      code: "title.weak",
      severity: "error",
      message: "Post title is missing or too short",
    });
  }

  if (excerptPlain.length < 80) {
    score += 2;
    pushFinding(findings, {
      code: "excerpt.thin",
      severity: "error",
      message: "Excerpt is missing or too short for meta description",
    });
  } else if (excerptPlain.length > 320) {
    score += 1;
    pushFinding(findings, {
      code: "excerpt.too_long",
      severity: "warning",
      message: "Excerpt may truncate in SERP snippets",
    });
  }

  const featured = post.featuredImage?.node;
  if (!featured?.sourceUrl) {
    score += 2;
    pushFinding(findings, {
      code: "image.missing",
      severity: "error",
      message: "Featured image is missing",
    });
  } else if ((featured.altText?.trim().length ?? 0) < 20) {
    score += 1;
    pushFinding(findings, {
      code: "alt_text.gap",
      severity: "warning",
      message: "Featured image ALT text is missing or weak",
    });
  }

  const otherLocale: Locale = locale === "en" ? "et" : "en";
  const hasTranslation = (post.translations ?? []).some((entry) => {
    const code = entry?.language?.code?.toLowerCase();
    return isLocale(code) && code === otherLocale;
  });

  if (!hasTranslation) {
    score += 1;
    pushFinding(findings, {
      code: "translation.missing",
      severity: "warning",
      message: `Missing ${otherLocale.toUpperCase()} translation`,
    });
  }

  return {
    entityType: "post",
    databaseId: post.databaseId,
    slug: post.slug,
    title,
    locale,
    score,
    findings,
  };
}

export function findDuplicateGroups(
  items: SeoAuditItemResult[],
  pickValue: (item: SeoAuditItemResult) => string | undefined,
) {
  const groups = new Map<string, number[]>();

  for (const item of items) {
    const value = pickValue(item)?.trim().toLowerCase();
    if (!value) {
      continue;
    }

    const existing = groups.get(value) ?? [];
    existing.push(item.databaseId);
    groups.set(value, existing);
  }

  return [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([value, databaseIds]) => ({ value, databaseIds }))
    .sort((a, b) => b.databaseIds.length - a.databaseIds.length);
}
