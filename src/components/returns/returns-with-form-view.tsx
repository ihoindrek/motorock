import Link from "next/link";
import type { LegalSection } from "@/components/legal/legal-document-view";
import { EditorialHero } from "@/components/content/editorial-hero";
import { WithdrawalForm } from "@/components/returns/withdrawal-form";
import { SHOWROOM } from "@/data/showroom";

type ReturnsWithFormViewProps = {
  eyebrow: string;
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

function renderParagraphPart(
  part: string | { type: "link"; label: string; href: string; external?: boolean },
  index: number,
) {
  if (typeof part === "string") {
    return <span key={index}>{part}</span>;
  }

  if (part.external) {
    return (
      <a
        key={index}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink underline-offset-2 hover:text-accent hover:underline"
      >
        {part.label}
      </a>
    );
  }

  return (
    <Link
      key={index}
      href={part.href}
      className="text-ink underline-offset-2 hover:text-accent hover:underline"
    >
      {part.label}
    </Link>
  );
}

function renderParagraph(
  paragraph: string | readonly (string | { type: "link"; label: string; href: string; external?: boolean })[],
  index: number,
) {
  if (typeof paragraph === "string") {
    return <p key={paragraph}>{paragraph}</p>;
  }

  return (
    <p key={`rich-${index}`}>
      {paragraph.map((part, partIndex) => renderParagraphPart(part, partIndex))}
    </p>
  );
}

export function ReturnsWithFormView({
  eyebrow,
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
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/75">
                {section.paragraphs.map((paragraph, paragraphIndex) =>
                  renderParagraph(paragraph, paragraphIndex),
                )}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {section.id === "how-to" ? (
                <div className="mt-8">
                  <WithdrawalForm />
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mx-auto mt-16 max-w-3xl border-t border-ink/10 pt-8 text-sm text-ink/60">
          {questionsLabel}{" "}
          <Link
            href={contactHref}
            className="text-ink underline-offset-2 hover:text-accent hover:underline"
          >
            {contactUsLabel}
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
