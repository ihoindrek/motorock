import type { Locale } from "@/i18n/config";

export type SeoAuditScope = "products" | "posts" | "all";

export type SeoAuditTarget = {
  scope?: SeoAuditScope;
  category?: string;
  limit?: number;
};

export type SeoAuditSeverity = "error" | "warning" | "info";

export type SeoAuditFinding = {
  code: string;
  severity: SeoAuditSeverity;
  message: string;
};

export type SeoAuditItemResult = {
  entityType: "product" | "post";
  databaseId: number;
  slug: string;
  title: string;
  seoTitle?: string;
  locale: Locale;
  score: number;
  findings: SeoAuditFinding[];
};

export type SeoAuditDuplicateGroup = {
  value: string;
  databaseIds: number[];
};

export type SeoAuditReport = {
  ok: boolean;
  locale: Locale;
  scope: SeoAuditScope;
  dryRun: true;
  summary: {
    scanned: number;
    products: number;
    posts: number;
    errors: number;
    warnings: number;
    avgScore: number;
    byCode: Record<string, number>;
  };
  duplicates: {
    titles: SeoAuditDuplicateGroup[];
    seoTitles: SeoAuditDuplicateGroup[];
  };
  items: SeoAuditItemResult[];
  durationMs: number;
};

export const DEFAULT_SEO_AUDIT_LIMIT = 200;
export const MAX_SEO_AUDIT_LIMIT = 500;
