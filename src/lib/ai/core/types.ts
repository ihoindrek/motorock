import type { Locale } from "@/i18n/config";

export type AiContentSection = "description" | "seo";

export type AiOverwriteStrategy = "if_empty" | "always" | "never";

export type AiGenerateOptions = {
  dryRun?: boolean;
  revalidate?: boolean;
  overwrite?: AiOverwriteStrategy;
  provider?: "openai" | "anthropic";
};

export type AiGenerateRequest = {
  productId: number;
  locale: Locale;
  sections: AiContentSection[];
  options?: AiGenerateOptions;
};

export type SectionWriteStatus =
  | "written"
  | "skipped"
  | "failed"
  | "validation_failed";

export type SectionPreview =
  | {
      section: "description";
      shortDescription: string;
      description: string;
    }
  | {
      section: "seo";
      title: string;
      metaDescription: string;
      keywords: string[];
    };

export type SectionWriteResult = {
  section: AiContentSection;
  locale: Locale;
  status: SectionWriteStatus;
  message?: string;
  validationErrors?: string[];
  preview?: SectionPreview;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
};

export type GenerateJobResult = {
  ok: boolean;
  jobId: string;
  productId: number;
  locale: Locale;
  dryRun: boolean;
  results: SectionWriteResult[];
  revalidated: boolean;
  durationMs: number;
};

export type BatchJobFailure = {
  ok: false;
  productId: number;
  locale: Locale;
  error: string;
  code: string;
};

export type BatchJobResult = {
  ok: boolean;
  batchId: string;
  dryRun: boolean;
  total: number;
  succeeded: number;
  failed: number;
  jobs: Array<GenerateJobResult | BatchJobFailure>;
  revalidated: boolean;
  durationMs: number;
};

export type GenerationContext = {
  locale: Locale;
  jobId: string;
  promptVersion: string;
  dryRun: boolean;
};

export type ValidationReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type GenerationResult<TOutput> = {
  section: AiContentSection;
  output: TOutput;
  validation: ValidationReport;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
};
