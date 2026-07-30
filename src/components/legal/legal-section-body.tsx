import Link from "next/link";
import type {
  LegalParagraphPart,
  LegalSection,
} from "@/components/legal/legal-document-view";
import { cn } from "@/lib/utils";

function renderParagraphPart(part: LegalParagraphPart, index: number) {
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
  paragraph: string | readonly LegalParagraphPart[],
  index: number,
) {
  if (typeof paragraph === "string") {
    return <p key={paragraph}>{paragraph}</p>;
  }

  return (
    <p key={`rich-${index}`}>
      {paragraph.map((part, partIndex) =>
        renderParagraphPart(part, partIndex),
      )}
    </p>
  );
}

type LegalSectionBodyProps = {
  sections: readonly LegalSection[];
};

export function LegalSectionBody({ sections }: LegalSectionBodyProps) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28">
          {section.title ? (
            <h2 className="font-body text-base font-semibold text-ink">
              {section.title}
            </h2>
          ) : null}
          <div
            className={cn(
              "space-y-4 text-base leading-relaxed text-ink/75",
              section.title ? "mt-3" : "",
            )}
          >
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
        </section>
      ))}
    </div>
  );
}

type LegalContactFooterProps = {
  questionsLabel: string;
  contactLabel: string;
  contactHref: string;
  emailPrompt: string;
  email: string;
  emailHref: string;
};

export function LegalContactFooter({
  questionsLabel,
  contactLabel,
  contactHref,
  emailPrompt,
  email,
  emailHref,
}: LegalContactFooterProps) {
  return (
    <p className="mt-12 border-t border-ink/10 pt-8 text-sm text-ink/60">
      {questionsLabel}{" "}
      <Link
        href={contactHref}
        className="text-ink underline-offset-2 hover:text-accent hover:underline"
      >
        {contactLabel}
      </Link>{" "}
      {emailPrompt}{" "}
      <a
        href={emailHref}
        className="text-ink underline-offset-2 hover:text-accent hover:underline"
      >
        {email}
      </a>
      .
    </p>
  );
}
