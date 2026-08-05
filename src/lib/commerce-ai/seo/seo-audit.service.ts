import type { Locale } from "@/i18n/config";
import { logStorefrontEvent } from "@/lib/monitoring/observability";
import { auditPost, auditProduct, findDuplicateGroups } from "@/lib/commerce-ai/seo/audit-rules";
import type {
  SeoAuditReport,
  SeoAuditScope,
  SeoAuditTarget,
} from "@/lib/commerce-ai/seo/audit-types";
import {
  DEFAULT_SEO_AUDIT_LIMIT,
  MAX_SEO_AUDIT_LIMIT,
} from "@/lib/commerce-ai/seo/audit-types";
import {
  fetchAuditPosts,
  fetchAuditProducts,
} from "@/lib/commerce-ai/seo/fetch-audit-data";

function resolveScope(target: SeoAuditTarget): SeoAuditScope {
  if (target.scope === "products" || target.scope === "posts" || target.scope === "all") {
    return target.scope;
  }

  return "all";
}

function resolveLimit(target: SeoAuditTarget) {
  const limit = Number(target.limit);
  if (!Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_SEO_AUDIT_LIMIT;
  }

  return Math.min(limit, MAX_SEO_AUDIT_LIMIT);
}

export class SeoAuditService {
  async run(input: {
    jobId: string;
    locale: Locale;
    target: SeoAuditTarget;
  }): Promise<SeoAuditReport> {
    const started = Date.now();
    const scope = resolveScope(input.target);
    const limit = resolveLimit(input.target);
    const perTypeLimit =
      scope === "all" ? Math.ceil(limit / 2) : limit;

    const items = [];

    if (scope === "products" || scope === "all") {
      const products = await fetchAuditProducts({
        locale: input.locale,
        category: input.target.category,
        limit: perTypeLimit,
      });

      items.push(...products.map((product) => auditProduct(product, input.locale)));
    }

    if (scope === "posts" || scope === "all") {
      const posts = await fetchAuditPosts({
        locale: input.locale,
        limit: perTypeLimit,
      });

      items.push(...posts.map((post) => auditPost(post, input.locale)));
    }

    items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const byCode: Record<string, number> = {};
    let errors = 0;
    let warnings = 0;

    for (const item of items) {
      for (const finding of item.findings) {
        byCode[finding.code] = (byCode[finding.code] ?? 0) + 1;
        if (finding.severity === "error") {
          errors += 1;
        } else if (finding.severity === "warning") {
          warnings += 1;
        }
      }
    }

    const productItems = items.filter((item) => item.entityType === "product");
    const postItems = items.filter((item) => item.entityType === "post");

    const report: SeoAuditReport = {
      ok: true,
      locale: input.locale,
      scope,
      dryRun: true,
      summary: {
        scanned: items.length,
        products: productItems.length,
        posts: postItems.length,
        errors,
        warnings,
        avgScore:
          items.length > 0
            ? Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 10) /
              10
            : 0,
        byCode,
      },
      duplicates: {
        titles: findDuplicateGroups(items, (item) => item.title),
        seoTitles: findDuplicateGroups(productItems, (item) => item.seoTitle),
      },
      items,
      durationMs: Date.now() - started,
    };

    logStorefrontEvent("commerce-ai.seo_audit", {
      jobId: input.jobId,
      locale: input.locale,
      scope,
      scanned: report.summary.scanned,
      errors: report.summary.errors,
      warnings: report.summary.warnings,
      durationMs: report.durationMs,
    });

    return report;
  }
}
