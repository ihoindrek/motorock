"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { CatalogProduct, ProductSpec } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import { formatPrice } from "@/lib/shop/category";
import { resolveProductColorHex } from "@/lib/shop/product-color-swatches";
import {
  hasMotorcycleTechnical,
} from "@/lib/shop/normalize-motorcycle-content";
import { BrandLogo } from "@/components/shop/brand-logo";
import { ShareButton } from "@/components/shop/share-button";
import { FinancingPriceTeaser } from "@/components/shop/financing-price-teaser";
import {
  MotorcycleActionModals,
  type MotorcycleModalAction,
} from "@/components/shop/motorcycle-action-modals";
import { MotorcycleColorPicker } from "@/components/shop/motorcycle-color-picker";
import { MotorcycleCtaBar } from "@/components/shop/motorcycle-cta-bar";
import { MotorcycleOverviewSection } from "@/components/shop/motorcycle-overview-section";
import { MotorcycleProductGallery } from "@/components/shop/motorcycle-product-gallery";
import { MotorcycleRelatedProducts } from "@/components/shop/motorcycle-related-products";
import { ProductFaqSection } from "@/components/shop/product-faq-section";
import { RecentlyViewedProducts } from "@/components/shop/recently-viewed-products";
import { recordRecentlyViewed } from "@/lib/shop/recently-viewed";
import { ShowroomPickupNote } from "@/components/shop/showroom-pickup-panel";
import { MotorcycleShippingNote } from "@/components/shop/motorcycle-shipping-note";
import { TestRideIcon } from "@/components/ui/test-ride-icon";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { trackViewMotorcycleProduct } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
        className={`font-body text-xs font-bold uppercase tracking-aggressive ${
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
              className={`font-body text-sm font-bold uppercase tracking-tight sm:text-right ${
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

function RichMotorcycleProductView({
  product,
  relatedProducts = [],
}: MotorcycleProductViewProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const mc = dict.motorcycle;
  const closerLookBody = mc.closerLookBody.replace("{name}", product.sync.name);
  const { sync, enrichment, content, showroomAvailable } = product;

  const colorSwatches = useMemo(() => {
    if (enrichment.colorSwatches?.length) {
      return enrichment.colorSwatches.map((option) => ({
        ...option,
        hex: option.hex ?? resolveProductColorHex(option.label),
      }));
    }

    if (sync.variations.length > 0) {
      return sync.variations.map((variation) => ({
        label: variation.color,
        hex: variation.hex ?? resolveProductColorHex(variation.color),
        image: variation.image,
      }));
    }

    return sync.colors
      .filter((color) => color && color !== "—")
      .map((label) => ({
        label,
        hex: resolveProductColorHex(label),
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

  useEffect(() => {
    trackViewMotorcycleProduct(product);
    recordRecentlyViewed({
      slug: product.slug,
      name: `${product.sync.brand} ${product.sync.name}`,
      price: product.sync.price,
      image: product.sync.images[0] ?? "",
      brand: product.sync.brand,
      type: "motorcycle",
    });
  }, [product]);

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
    ? mc.engineTransmission
    : mc.chassisPerformance;
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
  const showSupplementary = Boolean(supplementaryHtml);
  const showOverviewSection =
    content.overviewSections.length > 0 || showSupplementary;
  const parallaxImages = content.parallaxImages;
  const showEnglishContentNotice =
    locale === "et" &&
    (product.contentLocale !== "et" || product.contentUntranslated);

  return (
    <article
      className={cn(
        "bg-paper",
        sync.inStock &&
          relatedProducts.length === 0 &&
          "max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
      )}
    >
      {showEnglishContentNotice ? (
        <div
          role="status"
          className="border-b border-amber-200/80 bg-amber-50 text-ink/80"
        >
          <p className="site-container py-3 text-sm leading-relaxed">
            {dict.catalog.contentAvailableInEnglish}
          </p>
        </div>
      ) : null}
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
                <ol className="flex flex-wrap items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
                  <li>
                    <Link
                      href={product.backHref}
                      className="transition-colors hover:text-accent"
                    >
                      ← {dict.nav.motorcycles}
                    </Link>
                  </li>
                </ol>
              </nav>

              <div className="flex flex-wrap items-center gap-3">
                <BrandLogo brand={sync.brand} size="sm" />
                {enrichment.isNew ? (
                  <span className="bg-accent px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-aggressive text-paper">
                    {mc.newBadge}
                  </span>
                ) : null}
              </div>

              <h1 className="heading-product !normal-case !leading-[0.92] mt-4 text-[clamp(1.65rem,5vw,4.1rem)] sm:text-[clamp(1.9rem,5.5vw,4.1rem)] lg:mt-5">
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
                variant="hero"
                className="mt-8"
              />

              {sync.inStock ? (
                showroomAvailable ? (
                  <p className="mt-6 flex items-center gap-2.5 text-sm leading-snug text-ink/75 sm:text-base">
                    <span
                      className="size-2 shrink-0 rounded-full bg-stock motion-safe:animate-pulse"
                      aria-hidden="true"
                    />
                    {mc.onDisplay}
                  </p>
                ) : (
                  <p className="mt-6 flex items-center gap-2.5 text-sm leading-snug text-ink/65 sm:text-base">
                    <span
                      className="size-2 shrink-0 rounded-full bg-ink/30"
                      aria-hidden="true"
                    />
                    {mc.availableToOrder}
                  </p>
                )
              ) : (
                <p className="mt-6 text-xs text-ink/50">
                  {dict.pdp.contactAvailability}
                </p>
              )}

              <MotorcycleShippingNote className="mt-4" />

              {showColorPicker && colorSwatches.length > 0 ? (
                <div className="mt-8">
                  <MotorcycleColorPicker
                    options={colorSwatches}
                    value={color}
                    onChange={setColor}
                    heading={dict.forms.finish}
                    finishesAriaLabel={mc.availableFinishes}
                    theme="light"
                    variant="compact"
                  />
                </div>
              ) : sync.colors.length === 1 && sync.colors[0] !== "—" ? (
                <p className="mt-8 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
                  {dict.forms.finish} · {sync.colors[0]}
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
                        {mc.bookTestRide}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAction("question")}
                        className="btn-ghost min-w-[200px]"
                      >
                        {mc.askQuestion}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalAction("enquire")}
                        className="btn-accent min-w-[200px]"
                      >
                        {mc.enquireModel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAction("showroom")}
                        className="btn-ghost min-w-[200px]"
                      >
                        {mc.visitShowroom}
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
                    {mc.contactUs}
                  </button>
                </div>
              )}

              <ShareButton
                title={`${sync.brand} ${sync.name}`}
                className="mt-6"
              />
              <ShowroomPickupNote className="mt-4" />
            </div>

            <div className="order-1 min-w-0 lg:order-none lg:col-span-8 xl:col-span-8">
              <MotorcycleProductGallery
                images={sync.images}
                alt={sync.name}
                preferredImage={activeColorImage}
                layout="hero"
                vimeoId={content.vimeoId}
                videoTitle={`${sync.brand} ${sync.name}`}
                inStoreNow={showroomAvailable && sync.inStock}
              />
            </div>
          </div>
        </div>
      </section>

      {content.keySpecs.length > 0 ? (
        <section
          aria-label={mc.keySpecifications}
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
                <p className="font-body text-[9px] font-bold uppercase tracking-aggressive text-ink/40">
                  {spec.label}
                </p>
                <p className="mt-2 font-display text-[clamp(1.05rem,1.75vw,1.4rem)] font-extrabold uppercase leading-snug tracking-tight text-ink">
                  {spec.value}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {parallaxImages.length >= 3 ? (
        <section aria-label={mc.closerLookAria} className="bg-white">
          <div className="site-container py-14 lg:py-20">
            <h2 className="text-[clamp(2.2rem,5vw,3.85rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-ink">
              {mc.closerLook}
            </h2>
            <p className="mt-4 max-w-lg text-sm text-ink/55 sm:text-base">
              {closerLookBody}
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
        <MotorcycleOverviewSection
          eyebrow={mc.overview}
          productName={sync.name}
          sections={content.overviewSections}
          supplementaryHtml={showSupplementary ? supplementaryHtml : undefined}
          supplementaryLabel={mc.modelOverview}
        />
      ) : null}

      {showTechnical ? (
        <section className="bg-ink py-16 text-paper lg:py-24">
          <div className="site-container">
            <p className="section-eyebrow text-accent">{mc.technical}</p>
            <h2 className="mt-3 text-3xl font-extrabold uppercase leading-[0.92] sm:text-4xl">
              {mc.underTank}
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
                      className="mt-6 font-body text-[10px] font-bold uppercase tracking-aggressive text-accent hover:underline"
                    >
                      {showMoreSpecs ? mc.showLess : mc.showMore}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {content.dimensionSpecs.length > 0 ? (
                <SpecBlock
                  title={mc.dimensionsWeight}
                  specs={content.dimensionSpecs}
                  dark
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {product.faq && product.faq.length > 0 ? (
        <section className="site-container border-t border-ink/10 py-12 lg:py-16">
          <ProductFaqSection
            title={dict.pdp.faq}
            items={product.faq}
            variant="section"
          />
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <MotorcycleRelatedProducts
          products={relatedProducts}
          reserveMobileCtaSpace={sync.inStock}
        />
      ) : null}

      {/* Extra bottom space so the fixed mobile CTA bar does not cover the list. */}
      <div
        className={
          sync.inStock
            ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0"
            : undefined
        }
      >
        <RecentlyViewedProducts excludeSlug={product.slug} />
      </div>

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
