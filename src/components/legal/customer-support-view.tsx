import Link from "next/link";
import { CustomerServiceLayout } from "@/components/legal/customer-service-layout";
import type { LegalSection } from "@/components/legal/legal-document-view";
import {
  LegalContactFooter,
  LegalSectionBody,
} from "@/components/legal/legal-section-body";
import type { Locale } from "@/i18n/config";
import { SHOWROOM, getShowroomCopy } from "@/data/showroom";

type CustomerSupportViewProps = {
  locale: Locale;
  title: string;
  description: string;
  updated: string;
  sections: readonly LegalSection[];
  lastUpdatedLabel: string;
  questionsLabel: string;
  contactHref: string;
  emailPrompt: string;
  contactStrip: {
    emailLabel: string;
    phoneLabel: string;
    hoursLabel: string;
    formLabel: string;
  };
};

export function CustomerSupportView({
  locale,
  title,
  description,
  updated,
  sections,
  lastUpdatedLabel,
  questionsLabel,
  contactHref,
  emailPrompt,
  contactStrip,
}: CustomerSupportViewProps) {
  const showroom = getShowroomCopy(locale);
  const contentSections = sections.filter((section) => section.id !== "policies");

  return (
    <CustomerServiceLayout
      locale={locale}
      currentId="support"
      title={title}
      description={description}
      updated={updated}
      lastUpdatedLabel={lastUpdatedLabel}
    >
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <a
          href={SHOWROOM.emailHref}
          className="rounded-sm border border-ink/10 bg-surface/40 p-4 transition-colors hover:border-accent/40"
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {contactStrip.emailLabel}
          </p>
          <p className="mt-2 font-body text-sm font-semibold text-ink">
            {SHOWROOM.email}
          </p>
        </a>
        <a
          href={SHOWROOM.phoneHref}
          className="rounded-sm border border-ink/10 bg-surface/40 p-4 transition-colors hover:border-accent/40"
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {contactStrip.phoneLabel}
          </p>
          <p className="mt-2 font-body text-sm font-semibold text-ink">
            {SHOWROOM.phone}
          </p>
        </a>
        <div className="rounded-sm border border-ink/10 bg-surface/40 p-4">
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {contactStrip.hoursLabel}
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
            {showroom.hours.weekdays}
            <br />
            {showroom.hours.saturday}
            <br />
            {showroom.hours.sunday}
          </p>
        </div>
      </div>

      <LegalSectionBody sections={contentSections} />

      <p className="mt-8 text-sm text-ink/70">
        <Link
          href={contactHref}
          className="text-ink underline-offset-2 hover:text-accent hover:underline"
        >
          {contactStrip.formLabel}
        </Link>
      </p>

      <LegalContactFooter
        questionsLabel={questionsLabel}
        contactLabel={contactStrip.formLabel}
        contactHref={contactHref}
        emailPrompt={emailPrompt}
        email={SHOWROOM.email}
        emailHref={SHOWROOM.emailHref}
      />
    </CustomerServiceLayout>
  );
}
