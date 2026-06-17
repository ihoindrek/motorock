import Link from "next/link";
import { EditorialHero } from "@/components/content/editorial-hero";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

type LegalDocumentViewProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: readonly LegalSection[];
  lastUpdatedLabel: string;
  questionsLabel: string;
  contactUsLabel: string;
  contactHref: string;
};

export function LegalDocumentView({
  eyebrow,
  title,
  description,
  updated,
  sections,
  lastUpdatedLabel,
  questionsLabel,
  contactUsLabel,
  contactHref,
}: LegalDocumentViewProps) {
  return (
    <article>
      <EditorialHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        background="paper"
      />

      <div className="site-container py-12 lg:py-16">
        <p className="mb-10 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
          {lastUpdatedLabel} {updated}
        </p>

        <div className="mx-auto max-w-3xl space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/75">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
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
          <Link href={contactHref} className="text-ink underline-offset-2 hover:text-accent hover:underline">
            {contactUsLabel}
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:hello@motorock.eu"
            className="text-ink underline-offset-2 hover:text-accent hover:underline"
          >
            hello@motorock.eu
          </a>
          .
        </p>
      </div>
    </article>
  );
}
