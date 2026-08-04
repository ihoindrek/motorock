import type { Locale } from "@/i18n/config";
import type { GenerationContext, ValidationReport } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type {
  DescriptionSectionOutput,
  SeoSectionOutput,
} from "@/lib/ai/validation/schemas";
import { findForbiddenHtmlTags } from "@/lib/ai/validation/html-safety";

export class ContentQualityValidator {
  validateDescription(
    output: DescriptionSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const tag of findForbiddenHtmlTags(output.shortDescription)) {
      errors.push(`Forbidden HTML tag in shortDescription: ${tag}`);
    }

    for (const tag of findForbiddenHtmlTags(output.description)) {
      errors.push(`Forbidden HTML tag in description: ${tag}`);
    }

    if (product.brand && !mentionsBrand(output.description, product.brand)) {
      warnings.push("Brand not mentioned in long description");
    }

    if (!matchesLocaleHeuristic(output.description, context.locale)) {
      if (context.locale === "et") {
        errors.push(`Description language mismatch: expected ${context.locale}`);
      } else {
        warnings.push(`Description language may not match ${context.locale}`);
      }
    }

    return report(errors, warnings);
  }

  validateSeo(
    output: SeoSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (output.keywords.length !== new Set(output.keywords.map((k) => k.toLowerCase())).size) {
      errors.push("Duplicate SEO keywords");
    }

    if (product.brand && !mentionsBrand(output.title, product.brand)) {
      warnings.push("Brand not mentioned in SEO title");
    }

    if (!matchesLocaleHeuristic(output.metaDescription, context.locale)) {
      if (context.locale === "et") {
        errors.push(`Meta description language mismatch: expected ${context.locale}`);
      } else {
        warnings.push(`Meta description language may not match ${context.locale}`);
      }
    }

    return report(errors, warnings);
  }
}

function report(errors: string[], warnings: string[]): ValidationReport {
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function mentionsBrand(text: string, brand: string) {
  return text.toLowerCase().includes(brand.toLowerCase());
}

function matchesLocaleHeuristic(text: string, locale: Locale) {
  const sample = text.toLowerCase();

  if (locale === "et") {
    return /[äöüõ]/.test(sample) || /\b(ja|või|ning|le|on|jaoks)\b/.test(sample);
  }

  return !/[äöüõ]/.test(sample) || /\b(the|and|for|with|your)\b/.test(sample);
}
