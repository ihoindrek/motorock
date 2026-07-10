import type { MotorcycleEditorialSection } from "@/lib/shop/normalize-motorcycle-content";
import { ProductDescriptionHtml } from "@/components/shop/product-description-html";
import { cn } from "@/lib/utils";

type MotorcycleOverviewSectionProps = {
  eyebrow: string;
  productName: string;
  sections: readonly MotorcycleEditorialSection[];
  supplementaryHtml?: string;
  supplementaryLabel?: string;
};

function ModelOverviewAccordion({
  html,
  label,
}: {
  html: string;
  label: string;
}) {
  return (
    <details className="group border border-ink/10 bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-body text-[11px] font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </summary>
      <div className="border-t border-ink/10 px-5 py-6 sm:px-6 sm:py-8">
        <ProductDescriptionHtml html={html} />
      </div>
    </details>
  );
}

export function MotorcycleOverviewSection({
  eyebrow,
  productName,
  sections,
  supplementaryHtml,
  supplementaryLabel,
}: MotorcycleOverviewSectionProps) {
  const hasSections = sections.length > 0;
  const hasSupplementary = Boolean(supplementaryHtml?.trim());

  if (!hasSections && !hasSupplementary) {
    return null;
  }

  return (
    <section
      aria-label={eyebrow}
      className="bg-white py-16 text-ink lg:py-24"
    >
      <div className="site-container">
        {hasSections ? (
          <>
            <div className="max-w-3xl">
              <p className="section-eyebrow">{eyebrow}</p>
              <h2 className="mt-5 font-display text-[clamp(2rem,5.5vw,3.75rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-ink">
                {productName}
              </h2>
              <div
                aria-hidden="true"
                className="mt-6 h-0.5 w-16 origin-left bg-accent"
              />
            </div>

            <div className="mt-12 lg:mt-16">
              {sections.map((section) => (
                <article
                  key={section.title}
                  className="grid gap-6 border-t border-ink/10 py-10 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:py-14"
                >
                  <header className="lg:col-span-4">
                    <h3 className="max-w-xs font-display text-xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-2xl lg:text-[1.65rem]">
                      {section.title}
                    </h3>
                  </header>

                  <div className="lg:col-span-8">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraph}
                        className={cn(
                          paragraphIndex === 0
                            ? "text-lg font-semibold leading-[1.65] text-ink sm:text-xl"
                            : "text-sm leading-relaxed text-ink/72 sm:text-base",
                          paragraphIndex > 0 && "mt-4",
                        )}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {hasSupplementary && supplementaryHtml && supplementaryLabel ? (
          <div className={hasSections ? "mt-10 lg:mt-14" : "max-w-3xl"}>
            {!hasSections ? (
              <p className="section-eyebrow">{eyebrow}</p>
            ) : null}
            <ModelOverviewAccordion
              html={supplementaryHtml}
              label={supplementaryLabel}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
