import { CustomerServiceLayout } from "@/components/legal/customer-service-layout";
import {
  LegalContactFooter,
  LegalSectionBody,
} from "@/components/legal/legal-section-body";
import { SHOWROOM } from "@/data/showroom";
import type { Locale } from "@/i18n/config";
import type { CustomerServiceNavId } from "@/lib/legal/customer-service-nav";

export type LegalInlineLink = {
  type: "link";
  label: string;
  href: string;
  external?: boolean;
};

export type LegalParagraphPart = string | LegalInlineLink;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: readonly (string | readonly LegalParagraphPart[])[];
  bullets?: readonly string[];
};

type LegalDocumentViewProps = {
  locale: Locale;
  currentId: CustomerServiceNavId;
  title: string;
  description: string;
  updated: string;
  sections: readonly LegalSection[];
  lastUpdatedLabel: string;
  questionsLabel: string;
  contactUsLabel: string;
  contactHref: string;
  emailPrompt: string;
};

export function LegalDocumentView({
  locale,
  currentId,
  title,
  description,
  updated,
  sections,
  lastUpdatedLabel,
  questionsLabel,
  contactUsLabel,
  contactHref,
  emailPrompt,
}: LegalDocumentViewProps) {
  return (
    <CustomerServiceLayout
      locale={locale}
      currentId={currentId}
      title={title}
      description={description}
      updated={updated}
      lastUpdatedLabel={lastUpdatedLabel}
    >
      <LegalSectionBody sections={sections} />
      <LegalContactFooter
        questionsLabel={questionsLabel}
        contactLabel={contactUsLabel}
        contactHref={contactHref}
        emailPrompt={emailPrompt}
        email={SHOWROOM.email}
        emailHref={SHOWROOM.emailHref}
      />
    </CustomerServiceLayout>
  );
}
