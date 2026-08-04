import type { ReactNode } from "react";
import type { MotorcycleEditorialSection } from "@/lib/shop/normalize-motorcycle-content";
import { parseMarketingDescriptionSections } from "@/lib/shop/parse-marketing-description-sections";
import { ProductDescriptionHtml } from "@/components/shop/product-description-html";
import { cn } from "@/lib/utils";

type MotorcycleOverviewSectionProps = {
  eyebrow: string;
  productName: string;
  sections: readonly MotorcycleEditorialSection[];
  supplementaryHtml?: string;
  supplementaryLabel?: string;
};

function OverviewHeader({
  eyebrow,
  productName,
}: {
  eyebrow: string;
  productName: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="mt-5 font-body text-[clamp(2rem,5.5vw,3.75rem)] font-bold normal-case leading-[0.92] tracking-normal text-ink">
        {productName}
      </h2>
      <div
        aria-hidden="true"
        className="mt-6 h-0.5 w-16 origin-left bg-accent"
      />
    </div>
  );
}

function EditorialSectionBlock({
  title,
  children,
  lead = false,
}: {
  title: string;
  children: ReactNode;
  lead?: boolean;
}) {
  return (
    <article
      className={cn(
        "grid gap-6 border-t border-ink/10 py-10 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:py-14",
        lead && "border-t-0 pt-0 lg:pt-2",
      )}
    >
      {title ? (
        <header className="lg:col-span-4">
          <h3 className="max-w-xs text-xl sm:text-2xl lg:text-[1.65rem]">
            {title}
          </h3>
        </header>
      ) : null}

      <div className={title ? "lg:col-span-8" : "lg:col-span-12"}>{children}</div>
    </article>
  );
}

export function MotorcycleOverviewSection({
  eyebrow,
  productName,
  sections,
  supplementaryHtml,
  supplementaryLabel,
}: MotorcycleOverviewSectionProps) {
  const marketingSections = supplementaryHtml?.trim()
    ? parseMarketingDescriptionSections(supplementaryHtml)
    : [];
  const hasShortSections = sections.length > 0;
  const hasMarketing = marketingSections.length > 0;

  if (!hasShortSections && !hasMarketing) {
    return null;
  }

  return (
    <section aria-label={eyebrow} className="bg-white py-16 text-ink lg:py-24">
      <div className="site-container">
        <OverviewHeader eyebrow={eyebrow} productName={productName} />

        <div className="mt-12 lg:mt-16">
          {sections.map((section) => (
            <EditorialSectionBlock key={section.title} title={section.title}>
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
            </EditorialSectionBlock>
          ))}

          {hasMarketing ? (
            <div className={hasShortSections ? "mt-4 border-t border-ink/10 pt-10 lg:pt-14" : ""}>
              {hasShortSections && supplementaryLabel ? (
                <p className="mb-8 font-body text-[11px] font-bold uppercase tracking-aggressive text-accent">
                  {supplementaryLabel}
                </p>
              ) : null}

              {marketingSections.map((section, index) => (
                <EditorialSectionBlock
                  key={section.title || `marketing-${index}`}
                  title={section.title}
                  lead={!hasShortSections && index === 0}
                >
                  <ProductDescriptionHtml
                    html={section.bodyHtml}
                    variant="marketing"
                  />
                </EditorialSectionBlock>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
