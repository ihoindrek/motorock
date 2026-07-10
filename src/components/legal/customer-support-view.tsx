import Link from "next/link";
import { EditorialHero } from "@/components/content/editorial-hero";
import type { LegalSection } from "@/components/legal/legal-document-view";
import type { Locale } from "@/i18n/config";
import { SHOWROOM, getShowroomCopy } from "@/data/showroom";

type PolicyLink = {
  href: string;
  label: string;
};

type CustomerSupportViewProps = {
  eyebrow: string;
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
  policyLinks: readonly PolicyLink[];
  locale: Locale;
};

export function CustomerSupportView({
  eyebrow,
  title,
  description,
  updated,
  sections,
  lastUpdatedLabel,
  questionsLabel,
  contactHref,
  emailPrompt,
  contactStrip,
  policyLinks,
  locale,
}: CustomerSupportViewProps) {
  const showroom = getShowroomCopy(locale);
  return (
    <article>
      <EditorialHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        background="paper"
      />

      <div className="site-container py-12 lg:py-16">
        <div className="mx-auto mb-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <a
            href={SHOWROOM.emailHref}
            className="rounded-sm border border-ink/10 bg-surface/40 p-5 transition-colors hover:border-accent/40"
          >
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              {contactStrip.emailLabel}
            </p>
            <p className="mt-2 font-body text-sm font-bold text-ink">{SHOWROOM.email}</p>
          </a>
          <a
            href={SHOWROOM.phoneHref}
            className="rounded-sm border border-ink/10 bg-surface/40 p-5 transition-colors hover:border-accent/40"
          >
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
              {contactStrip.phoneLabel}
            </p>
            <p className="mt-2 font-body text-sm font-bold text-ink">{SHOWROOM.phone}</p>
          </a>
          <div className="rounded-sm border border-ink/10 bg-surface/40 p-5">
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

        <p className="mx-auto mb-10 max-w-3xl font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
          {lastUpdatedLabel} {updated}
        </p>

        <div className="mx-auto max-w-3xl space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/75">
                {section.paragraphs.map((paragraph, paragraphIndex) => {
                  if (typeof paragraph === "string") {
                    return <p key={paragraph}>{paragraph}</p>;
                  }

                  return (
                    <p key={`rich-${paragraphIndex}`}>
                      {paragraph.map((part, partIndex) =>
                        typeof part === "string" ? (
                          <span key={partIndex}>{part}</span>
                        ) : part.external ? (
                          <a
                            key={partIndex}
                            href={part.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink underline-offset-2 hover:text-accent hover:underline"
                          >
                            {part.label}
                          </a>
                        ) : (
                          <Link
                            key={partIndex}
                            href={part.href}
                            className="text-ink underline-offset-2 hover:text-accent hover:underline"
                          >
                            {part.label}
                          </Link>
                        ),
                      )}
                    </p>
                  );
                })}
                {section.id === "policies" ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {policyLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-ink underline-offset-2 hover:text-accent hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : section.bullets && section.bullets.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <p className="mx-auto mt-16 max-w-3xl border-t border-ink/10 pt-8 text-sm text-ink/60">
          {questionsLabel}{" "}
          <Link
            href={contactHref}
            className="text-ink underline-offset-2 hover:text-accent hover:underline"
          >
            {contactStrip.formLabel}
          </Link>{" "}
          {emailPrompt}{" "}
          <a
            href={SHOWROOM.emailHref}
            className="text-ink underline-offset-2 hover:text-accent hover:underline"
          >
            {SHOWROOM.email}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
