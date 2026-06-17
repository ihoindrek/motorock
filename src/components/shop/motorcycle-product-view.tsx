"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogProduct, ProductSpec } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import { formatPrice } from "@/lib/shop/category";
import { guessHexFromColorLabel } from "@/lib/shop/product-color-swatches";
import {
  hasMotorcycleTechnical,
} from "@/lib/shop/normalize-motorcycle-content";
import { BrandLogo } from "@/components/shop/brand-logo";
import { FinancingPriceTeaser } from "@/components/shop/financing-price-teaser";
import {
  MotorcycleActionModals,
  type MotorcycleModalAction,
} from "@/components/shop/motorcycle-action-modals";
import { MotorcycleColorPicker } from "@/components/shop/motorcycle-color-picker";
import { MotorcycleCtaBar } from "@/components/shop/motorcycle-cta-bar";
import { MotorcycleProductGallery } from "@/components/shop/motorcycle-product-gallery";
import { ProductDescriptionHtml } from "@/components/shop/product-description-html";
import { MotorcycleRelatedProducts } from "@/components/shop/motorcycle-related-products";
import { TestRideIcon } from "@/components/ui/test-ride-icon";
import { ZoomParallax } from "@/components/ui/zoom-parallax";

type MotorcycleProductViewProps = {
  product: MotorcycleProduct;
  relatedProducts?: readonly CatalogProduct[];
};

function SpecBlock({
  title,
  specs,
  dark = false,
}: {
  title: string;
  specs: readonly ProductSpec[];
  dark?: boolean;
}) {
  return (
    <div>
      <h3
        className={`font-display text-xs font-bold uppercase tracking-aggressive ${
          dark ? "text-paper/40" : "text-ink/45"
        }`}
      >
        {title}
      </h3>
      <dl className="mt-6 space-y-0">
        {specs.map((spec) => (
          <div
            key={spec.id}
            className={`grid grid-cols-1 gap-1 border-t py-3 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6 ${
              dark ? "border-paper/10" : "border-ink/10"
            }`}
          >
            <dt
              className={`text-xs ${dark ? "text-paper/55" : "text-ink/55"}`}
            >
              {spec.label}
            </dt>
            <dd
              className={`font-display text-sm font-bold uppercase tracking-tight sm:text-right ${
                dark ? "text-paper" : "text-ink"
              }`}
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ModelOverviewAccordion({ html }: { html: string }) {
  return (
    <details className="group border border-ink/10 bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
        Model overview
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

function RichMotorcycleProductView({
  product,
  relatedProducts = [],
}: MotorcycleProductViewProps) {
  const { sync, enrichment, content, showroomAvailable } = product;

  const colorSwatches = useMemo(() => {
    if (enrichment.colorSwatches?.length) {
      return enrichment.colorSwatches.map((option) => ({
        ...option,
        hex: option.hex ?? guessHexFromColorLabel(option.label),
      }));
    }

    if (sync.variations.length > 0) {
      return sync.variations.map((variation) => ({
        label: variation.color,
        hex: variation.hex ?? guessHexFromColorLabel(variation.color),
        image: variation.image,
      }));
    }

    return sync.colors
      .filter((color) => color && color !== "—")
      .map((label) => ({
        label,
        hex: guessHexFromColorLabel(label),
        image: undefined,
      }));
  }, [enrichment.colorSwatches, sync.variations, sync.colors]);

  const [color, setColor] = useState(
    () => sync.colors[0] ?? sync.variations[0]?.color ?? "",
  );
  const [showMoreSpecs, setShowMoreSpecs] = useState(false);
  const [modalAction, setModalAction] = useState<MotorcycleModalAction | null>(
    null,
  );

  const openPrimaryAction = () => {
    setModalAction(showroomAvailable ? "test-ride" : "enquire");
  };

  const activeVariation = sync.variations.find(
    (variation) => variation.color === color,
  );
  const activeColorImage =
    activeVariation?.image ??
    colorSwatches.find((swatch) => swatch.label === color)?.image;

  const heroLine =
    content.tagline?.trim() || sync.shortDescription.trim() || undefined;
  const hasEngineSpecs = content.engineSpecs.length > 0;
  const leftColumnTitle = hasEngineSpecs
    ? "Engine & transmission"
    : "Chassis & performance";
  const leftColumnSpecs =
    showMoreSpecs && hasEngineSpecs
      ? [...content.engineSpecs, ...content.extendedSpecs]
      : hasEngineSpecs
        ? content.engineSpecs
        : content.extendedSpecs;
  const showMoreButton = hasEngineSpecs && content.extendedSpecs.length > 0;
  const showColorPicker = sync.colors.length > 1 || colorSwatches.length > 1;
  const showTechnical = hasMotorcycleTechnical(content);
  const supplementaryHtml = content.supplementaryHtml?.trim();
  const showSupplementary =
    Boolean(supplementaryHtml) && !showTechnical;
  const showOverviewSection =
    content.overviewSections.length > 0 || showSupplementary;
  const parallaxImages = content.parallaxImages;

  return (
    <article className="bg-paper max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <section className="relative overflow-hidden bg-moto text-ink">
        <div className="site-container relative max-lg:pt-0 pb-4 lg:py-6">
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-8">
            <div
              className={`relative z-10 order-2 lg:order-none lg:col-span-4 xl:col-span-4 lg:pb-4 xl:pb-6 ${
                sync.inStock
                  ? "max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
                  : ""
              }`}
            >
              <nav aria-label="Breadcrumb" className="mb-5 lg:mb-6">
                <ol className="flex flex-wrap items-center gap-2 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
                  <li>
                    <Link
                      href={product.backHref}
                      className="transition-colors hover:text-accent"
                    >
                      ← {product.backLabel}
                    </Link>
                  </li>
                </ol>
              </nav>

              <div className="flex flex-wrap items-center gap-3">
                <BrandLogo brand={sync.brand} size="sm" />
                {enrichment.isNew ? (
                  <span className="bg-accent px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-aggressive text-paper">
                    New
                  </span>
                ) : null}
              </div>

              <h1 className="heading-product !normal-case !leading-[0.92] mt-4 text-[clamp(1.5rem,4.5vw,3.75rem)] sm:text-[clamp(1.75rem,5vw,3.75rem)] lg:mt-5">
                {sync.name}
              </h1>

              {heroLine ? (
                <p
                  className={`mt-5 max-w-md text-lg font-semibold leading-snug sm:text-xl lg:text-2xl ${
                    content.tagline?.trim()
                      ? "text-accent"
                      : "text-ink/70"
                  }`}
                >
                  {heroLine}
                </p>
              ) : null}

              <FinancingPriceTeaser
                price={sync.price}
                productType="motorcycle"
                productName={sync.name}
                variant="hero"
                className="mt-8"
                onEnquire={() => setModalAction("question")}
              />

              {sync.inStock ? (
                showroomAvailable ? (
                  <p className="mt-6 flex items-center gap-2 text-xs text-ink/70">
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-stock motion-safe:animate-pulse"
                      aria-hidden="true"
                    />
                    On display in our Tallinn showroom — come see it and book
                    a test ride
                  </p>
                ) : (
                  <p className="mt-6 flex items-center gap-2 text-xs text-ink/60">
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-ink/30"
                      aria-hidden="true"
                    />
                    Available to order — contact us to arrange a viewing
                  </p>
                )
              ) : (
                <p className="mt-6 text-xs text-ink/50">
                  Contact us for availability
                </p>
              )}

              {showColorPicker && colorSwatches.length > 0 ? (
                <div className="mt-8">
                  <MotorcycleColorPicker
                    options={colorSwatches}
                    value={color}
                    onChange={setColor}
                    theme="light"
                    variant="compact"
                  />
                </div>
              ) : sync.colors.length === 1 && sync.colors[0] !== "—" ? (
                <p className="mt-8 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
                  Finish · {sync.colors[0]}
                </p>
              ) : null}

              {sync.inStock ? (
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {showroomAvailable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalAction("test-ride")}
                        className="btn-accent min-w-[200px] gap-2"
                      >
                        <TestRideIcon />
                        Book a test ride
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAction("question")}
                        className="btn-ghost min-w-[200px]"
                      >
                        Ask a question
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalAction("enquire")}
                        className="btn-accent min-w-[200px]"
                      >
                        Enquire about this model
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAction("showroom")}
                        className="btn-ghost min-w-[200px]"
                      >
                        Visit showroom
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setModalAction("contact")}
                    className="btn-accent min-w-[200px]"
                  >
                    Contact us
                  </button>
                </div>
              )}
            </div>

            <div className="order-1 min-w-0 lg:order-none lg:col-span-8 xl:col-span-8">
              <MotorcycleProductGallery
                images={sync.images}
                alt={sync.name}
                preferredImage={activeColorImage}
                layout="hero"
                vimeoId={content.vimeoId}
                videoTitle={`${sync.brand} ${sync.name}`}
              />
            </div>
          </div>
        </div>
      </section>

      {content.keySpecs.length > 0 ? (
        <section
          aria-label="Key specifications"
          className="border-b border-ink/10 bg-paper"
        >
          <ul className="site-container grid grid-cols-2 lg:grid-cols-4">
            {content.keySpecs.map((spec, index) => (
              <li
                key={spec.id}
                className={`px-4 py-5 sm:px-5 sm:py-6 ${
                  index % 2 === 0 ? "border-r border-ink/10 lg:border-r-0" : ""
                } ${index < 2 ? "border-b border-ink/10 lg:border-b-0" : ""} ${
                  index < content.keySpecs.length - 1
                    ? "lg:border-r lg:border-ink/10"
                    : ""
                }`}
              >
                <p className="font-display text-[9px] font-bold uppercase tracking-aggressive text-ink/40">
                  {spec.label}
                </p>
                <p className="mt-2 font-display text-[clamp(0.9375rem,1.6vw,1.25rem)] font-extrabold uppercase leading-snug tracking-tight text-ink">
                  {spec.value}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {parallaxImages.length >= 3 ? (
        <section aria-label="Closer look" className="bg-white">
          <div className="site-container py-14 lg:py-20">
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-ink">
              Closer look
            </h2>
            <p className="mt-4 max-w-lg text-sm text-ink/55 sm:text-base">
              Every angle of the {sync.name} — scroll to explore.
            </p>
          </div>
          <ZoomParallax
            images={[...parallaxImages]}
            className="bg-white"
            stickyClassName="sticky top-0 h-svh overflow-hidden bg-white"
          />
        </section>
      ) : null}

      {showOverviewSection ? (
      <section className="bg-white py-16 lg:py-24">
        <div className="site-container max-w-3xl">
          {content.overviewSections.length > 0 ? (
            <div>
              <p className="section-eyebrow">Overview</p>
              <div className="mt-6 space-y-10">
                {content.overviewSections.map((section) => (
                  <div key={section.title}>
                    <h2 className="font-display text-xs font-bold uppercase tracking-aggressive text-ink/45">
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/75 sm:text-base">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showSupplementary && supplementaryHtml ? (
            <div className={content.overviewSections.length > 0 ? "mt-10" : ""}>
              <ModelOverviewAccordion html={supplementaryHtml} />
            </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {showTechnical ? (
        <section className="bg-ink py-16 text-paper lg:py-24">
          <div className="site-container">
            <p className="section-eyebrow text-accent">Technical</p>
            <h2 className="mt-3 text-2xl font-extrabold uppercase leading-[0.92] sm:text-3xl">
              Under the tank
            </h2>

            <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
              {leftColumnSpecs.length > 0 ? (
                <div>
                  <SpecBlock
                    title={leftColumnTitle}
                    specs={leftColumnSpecs}
                    dark
                  />
                  {showMoreButton ? (
                    <button
                      type="button"
                      onClick={() => setShowMoreSpecs((open) => !open)}
                      className="mt-6 font-display text-[10px] font-bold uppercase tracking-aggressive text-accent hover:underline"
                    >
                      {showMoreSpecs ? "Show less" : "Show more"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {content.dimensionSpecs.length > 0 ? (
                <SpecBlock
                  title="Dimensions & weight"
                  specs={content.dimensionSpecs}
                  dark
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <MotorcycleRelatedProducts products={relatedProducts} />
      ) : null}

      <MotorcycleCtaBar
        name={sync.name}
        color={color}
        price={sync.price}
        inStock={sync.inStock}
        showroomAvailable={showroomAvailable}
        onPrimaryClick={openPrimaryAction}
      />

      <MotorcycleActionModals
        action={modalAction}
        onClose={() => setModalAction(null)}
        product={{
          slug: product.slug,
          name: sync.name,
          brand: sync.brand,
          color: color || undefined,
        }}
      />
    </article>
  );
}

export function MotorcycleProductView(props: MotorcycleProductViewProps) {
  return <RichMotorcycleProductView {...props} />;
}
