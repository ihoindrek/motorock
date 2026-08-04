"use client";

import { TextRevealFaqs, type TextRevealFaqItem } from "@/components/ui/text-reveal-faqs";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";

export type ProductFaqEntry = {
  question: string;
  answer: string;
};

type ProductFaqSectionProps = {
  title: string;
  items: readonly ProductFaqEntry[];
  variant?: "inline" | "section";
};

function toFaqItems(items: readonly ProductFaqEntry[]): TextRevealFaqItem[] {
  return items.map((item, index) => ({
    id: `faq-${index}`,
    question: item.question,
    answer: item.answer,
  }));
}

export function ProductFaqSection({
  title,
  items,
  variant = "inline",
}: ProductFaqSectionProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const supportHref = localizedHref(locale, "/support");

  return (
    <TextRevealFaqs
      title={title}
      description={dict.pdp.faqDescription}
      items={toFaqItems(items)}
      supportPrefix={dict.pdp.faqSupportPrefix}
      supportLinkLabel={dict.pdp.faqSupportLink}
      supportHref={supportHref}
      variant={variant}
    />
  );
}
