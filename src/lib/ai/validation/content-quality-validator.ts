import type { Locale } from "@/i18n/config";
import type { GenerationContext, ValidationReport } from "@/lib/ai/core/types";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type {
  DescriptionSectionOutput,
  FaqSectionOutput,
  AltTextSectionOutput,
  SeoSectionOutput,
} from "@/lib/ai/validation/schemas";
import { findForbiddenHtmlTags } from "@/lib/ai/validation/html-safety";
import { matchesLocaleHeuristic } from "@/lib/ai/domain/locale-heuristic";
import { isForbiddenFaqTopic } from "@/lib/ai/validation/faq-forbidden-topics";

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

  validateFaq(
    output: FaqSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    const questions = output.items.map((item) => item.question.trim().toLowerCase());
    if (questions.length !== new Set(questions).size) {
      errors.push("Duplicate FAQ questions");
    }

    for (const item of output.items) {
      if (isForbiddenFaqTopic(item.question, item.answer)) {
        errors.push(
          "FAQ must not cover stock, showroom availability, or delivery tied to current inventory",
        );
        break;
      }

      if (!item.question.trim().endsWith("?")) {
        warnings.push("FAQ question should end with a question mark");
      }

      if (!matchesLocaleHeuristic(item.answer, context.locale)) {
        if (context.locale === "et") {
          errors.push(`FAQ answer language mismatch: expected ${context.locale}`);
        } else {
          warnings.push(`FAQ answer language may not match ${context.locale}`);
        }
      }
    }

    if (product.brand && !output.items.some((item) => mentionsBrand(item.answer, product.brand!))) {
      warnings.push("Brand not mentioned in FAQ answers");
    }

    return report(errors, warnings);
  }

  validateAltText(
    output: AltTextSectionOutput,
    product: NormalizedProduct,
    context: GenerationContext,
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (product.images.length === 0) {
      errors.push("Product has no images for ALT text generation");
      return report(errors, warnings);
    }

    const indexes = output.items.map((item) => item.imageIndex);
    if (indexes.length !== new Set(indexes).size) {
      errors.push("Duplicate imageIndex values in ALT output");
    }

    for (const item of output.items) {
      if (item.imageIndex >= product.images.length) {
        errors.push(`ALT imageIndex ${item.imageIndex} is out of range`);
      }

      if (product.brand && !mentionsBrand(item.altText, product.brand)) {
        warnings.push(`Brand not mentioned in ALT text for image ${item.imageIndex}`);
      }

      // Alt text often mixes brand/product Latin names — locale is prompt-enforced, not heuristic-enforced.
      if (!matchesLocaleHeuristic(item.altText, context.locale)) {
        warnings.push(`ALT text language may not match ${context.locale}`);
      }
    }

    for (let index = 0; index < product.images.length; index += 1) {
      if (!indexes.includes(index)) {
        errors.push(`Missing ALT text for imageIndex ${index}`);
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

export { matchesLocaleHeuristic };
