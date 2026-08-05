import type { Locale } from "@/i18n/config";
import { logStorefrontEvent } from "@/lib/monitoring/observability";
import { auditPost, auditProduct, findDuplicateGroups } from "@/lib/commerce-ai/seo/audit-rules";
import type {
  SeoAuditItemResult,
  SeoAuditReport,
  SeoAuditScope,
  SeoAuditTarget,
} from "@/lib/commerce-ai/seo/audit-types";
import {
  DEFAULT_SEO_AUDIT_LIMIT,
  MAX_SEO_AUDIT_LIMIT,
  SEO_AUDIT_CHUNK_SIZE,
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

function buildReport(input: {
  locale: Locale;
  scope: SeoAuditScope;
  items: SeoAuditItemResult[];
  started: number;
  pagination?: SeoAuditReport["pagination"];
}): SeoAuditReport {
  const items = [...input.items].sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title),
  );

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

  return {
    ok: true,
    locale: input.locale,
    scope: input.scope,
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
    durationMs: Date.now() - input.started,
    pagination: input.pagination,
  };
}

export class SeoAuditService {
  async run(input: {
    jobId: string;
    locale: Locale;
    target: SeoAuditTarget;
  }): Promise<SeoAuditReport> {
    const started = Date.now();
    const scope = resolveScope(input.target);
    const totalLimit = resolveLimit(input.target);
    const chunkOffset =
      input.target.offset ??
      (input.target.chunkSize !== undefined ? 0 : undefined);

    if (chunkOffset !== undefined) {
      const phase = scope === "products" || scope === "posts" ? scope : "products";
      const perTypeLimit = scope === "all" ? Math.ceil(totalLimit / 2) : totalLimit;
      const requestedChunk = Number(input.target.chunkSize);
      const maxChunk =
        Number.isInteger(requestedChunk) && requestedChunk > 0
          ? Math.min(requestedChunk, SEO_AUDIT_CHUNK_SIZE)
          : SEO_AUDIT_CHUNK_SIZE;
      const chunkSize = Math.max(0, Math.min(maxChunk, perTypeLimit - chunkOffset));

      if (chunkSize === 0) {
        return buildReport({
          locale: input.locale,
          scope: phase,
          items: [],
          started,
          pagination: {
            offset: chunkOffset,
            returned: 0,
            hasMore: false,
            phase,
            totalTarget: perTypeLimit,
          },
        });
      }

      const items: SeoAuditItemResult[] = [];

      if (phase === "products") {
        const products = await fetchAuditProducts({
          locale: input.locale,
          category: input.target.category,
          limit: chunkSize,
          offset: chunkOffset,
        });
        items.push(...products.map((product) => auditProduct(product, input.locale)));
      } else {
        const posts = await fetchAuditPosts({
          locale: input.locale,
          limit: chunkSize,
          offset: chunkOffset,
        });
        items.push(...posts.map((post) => auditPost(post, input.locale)));
      }

      const nextOffset = chunkOffset + items.length;
      const hasMore = items.length === chunkSize && nextOffset < perTypeLimit;

      const report = buildReport({
        locale: input.locale,
        scope: phase,
        items,
        started,
        pagination: {
          offset: chunkOffset,
          returned: items.length,
          hasMore,
          phase,
          totalTarget: perTypeLimit,
        },
      });

      logStorefrontEvent("commerce-ai.seo_audit", {
        jobId: input.jobId,
        locale: input.locale,
        scope: phase,
        scanned: report.summary.scanned,
        chunkOffset,
        hasMore,
        durationMs: report.durationMs,
      });

      return report;
    }

    const perTypeLimit = scope === "all" ? Math.ceil(totalLimit / 2) : totalLimit;
    const items: SeoAuditItemResult[] = [];

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

    const report = buildReport({
      locale: input.locale,
      scope,
      items,
      started,
    });

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
