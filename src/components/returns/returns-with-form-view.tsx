import { CustomerServiceLayout } from "@/components/legal/customer-service-layout";
import type { LegalSection } from "@/components/legal/legal-document-view";
import {
  LegalContactFooter,
  LegalSectionBody,
} from "@/components/legal/legal-section-body";
import { WithdrawalForm } from "@/components/returns/withdrawal-form";
import type { Locale } from "@/i18n/config";
import { SHOWROOM } from "@/data/showroom";

type ReturnsWithFormViewProps = {
  locale: Locale;
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

export function ReturnsWithFormView({
  locale,
  title,
  description,
  updated,
  sections,
  lastUpdatedLabel,
  questionsLabel,
  contactUsLabel,
  contactHref,
  emailPrompt,
}: ReturnsWithFormViewProps) {
  const sectionsBeforeForm = sections.filter((section) => section.id !== "how-to");
  const howToSection = sections.find((section) => section.id === "how-to");

  return (
    <CustomerServiceLayout
      locale={locale}
      currentId="returns"
      title={title}
      description={description}
      updated={updated}
      lastUpdatedLabel={lastUpdatedLabel}
    >
      <LegalSectionBody sections={sectionsBeforeForm} />

      {howToSection ? (
        <section id="how-to" className="mt-10 scroll-mt-28">
          <h2 className="font-body text-base font-semibold text-ink">
            {howToSection.title}
          </h2>
          <div className="mt-3">
            <LegalSectionBody
              sections={[
                {
                  ...howToSection,
                  id: "how-to-content",
                  title: "",
                },
              ]}
            />
          </div>
          <div id="withdrawal-form" className="mt-8 scroll-mt-28">
            <WithdrawalForm />
          </div>
        </section>
      ) : null}

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
