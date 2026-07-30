"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { useCart } from "@/context/cart-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { trackViewItem } from "@/lib/analytics";
import { recordRecentlyViewed } from "@/lib/shop/recently-viewed";
import { resolveLineVariationId } from "@/lib/shop/resolve-cart-variation";
import { formatSizeButtonParts, formatSizeLabel, isCompoundSizeLabel } from "@/lib/shop/size-label";
import { sortProductSizes } from "@/lib/shop/sort-sizes";
import { BrandLogo } from "@/components/shop/brand-logo";
import { FinancingPriceTeaser } from "@/components/shop/financing-price-teaser";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductSpecs } from "@/components/shop/product-specs";
import { RecentlyViewedProducts } from "@/components/shop/recently-viewed-products";
import { RelatedProducts } from "@/components/shop/related-products";
import { EquipmentReturnPromise } from "@/components/shop/equipment-return-promise";
import { SizeGuideModal } from "@/components/shop/size-guide-modal";
import { EquipmentColorPicker } from "@/components/shop/equipment-color-picker";
import { EquipmentStickyAtc } from "@/components/shop/equipment-sticky-atc";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ShareButton } from "@/components/shop/share-button";
import { ProductShippingReturnsPanel } from "@/components/shop/product-shipping-returns-panel";
import { resolveSizeGuide } from "@/lib/shop/resolve-size-guide";
import {
  buildProductColorOptions,
  hasMultipleColorChoices,
  getSelectableColors,
} from "@/lib/shop/product-color-swatches";

type EquipmentProductViewProps = {
  product: CatalogProduct;
  relatedProducts?: readonly CatalogProduct[];
  defaultShippingCountry?: string;
};

function firstVariationId(product: CatalogProduct) {
  const fromVariations = product.variations?.find(
    (variation) => variation.databaseId,
  )?.databaseId;
  if (fromVariations) {
    return fromVariations;
  }

  const ids = product.variationIds
    ? Object.values(product.variationIds)
    : [];
  return ids[0];
}

function isVideoSrc(src: string) {
  return src.endsWith(".mp4") || src.endsWith(".webm");
}

function CollapsiblePanel({
  open,
  children,
  collapsedSize = "0fr",
  className,
}: {
  open: boolean;
  children: ReactNode;
  /** CSS track size when closed — `0fr` or e.g. `7rem` for a peek. */
  collapsedSize?: string;
  className?: string;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${className ?? ""}`}
      style={{ gridTemplateRows: open ? "1fr" : collapsedSize }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function CraftAccordion({
  open,
  title,
  children,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <div className="border-t border-ink/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          onOpenChange?.(!open);
        }}
        className="flex w-full cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-body text-[11px] font-bold uppercase tracking-aggressive text-ink"
      >
        {title}
        <span
          className={`text-lg font-normal leading-none text-ink/40 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <CollapsiblePanel open={open}>
        <div className="pb-5">{children}</div>
      </CollapsiblePanel>
    </div>
  );
}

export function EquipmentProductView({
  product,
  relatedProducts = [],
  defaultShippingCountry = "EE",
}: EquipmentProductViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();
  const { addItem, openCart } = useCart();
  const sizes = useMemo(
    () => sortProductSizes(product.sizes),
    [product.sizes],
  );
  const hasCompoundSizes = useMemo(
    () => sizes.some((option) => isCompoundSizeLabel(option)),
    [sizes],
  );
  const selectableColors = useMemo(
    () => getSelectableColors(product.colors),
    [product.colors],
  );
  const showColorPicker = hasMultipleColorChoices(product.colors);
  const colorOptions = useMemo(
    () => buildProductColorOptions(product.colors, product.variations),
    [product.colors, product.variations],
  );
  const [size, setSize] = useState(() =>
    formatSizeLabel(sortProductSizes(product.sizes)[0] ?? dict.pdp.oneSize),
  );
  const [color, setColor] = useState(() => selectableColors[0] ?? "");
  const [added, setAdded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [stickyAtcVisible, setStickyAtcVisible] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<
    "features" | "specifications" | "shipping" | null
  >(null);
  const atcSentinelRef = useRef<HTMLDivElement | null>(null);
  const descriptionBodyRef = useRef<HTMLDivElement | null>(null);
  const [descriptionMaxHeight, setDescriptionMaxHeight] = useState<number>(112);

  const sizeGuide = useMemo(() => resolveSizeGuide(product), [product]);

  useEffect(() => {
    setSize(formatSizeLabel(sizes[0] ?? dict.pdp.oneSize));
  }, [product.slug, sizes]);

  useEffect(() => {
    setColor(selectableColors[0] ?? "");
  }, [product.slug, selectableColors]);

  useEffect(() => {
    setActiveAccordion(null);
    setDescriptionExpanded(false);
  }, [product.slug]);

  useEffect(() => {
    const node = atcSentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyAtcVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [product.slug]);

  const activeColorImage = useMemo(() => {
    if (!showColorPicker || !color) {
      return product.image;
    }

    return (
      product.variations?.find((variation) => variation.color === color)
        ?.image ?? product.image
    );
  }, [color, product.image, product.variations, showColorPicker]);

  const galleryImages = useMemo(() => {
    const sources = [
      activeColorImage,
      product.image,
      ...(product.gallery ?? []),
      isVideoSrc(product.lifestyleImage) ? null : product.lifestyleImage,
    ].filter((src): src is string => Boolean(src));

    return [...new Set(sources)];
  }, [activeColorImage, product.gallery, product.image, product.lifestyleImage]);

  const hasLongDescription =
    (product.descriptionHtml?.length ?? 0) > 320 ||
    product.description.length > 220;

  useEffect(() => {
    const node = descriptionBodyRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      setDescriptionMaxHeight(node.scrollHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [product.description, product.descriptionHtml, galleryImages.length]);

  useEffect(() => {
    trackViewItem(product);
    recordRecentlyViewed({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
      type: product.type,
    });
  }, [product]);

  const cartPayload = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: activeColorImage,
    brand: product.brand,
    type: product.type,
    size,
    color: showColorPicker ? color : undefined,
    productId: product.databaseId,
    variationId: resolveLineVariationId(product, size, showColorPicker ? color : undefined),
  };

  const handleAdd = () => {
    addItem(cartPayload);
    openCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(cartPayload);
    router.push(`${localizedHref(locale, "/cart")}?step=2`);
  };

  return (
    <>
    <div className="bg-detail pb-24 lg:pb-0">
      <div className="site-container max-lg:pt-0 py-6 lg:py-10">
      <div className="flex flex-col gap-10 max-lg:gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <nav aria-label="Breadcrumb" className="order-1 max-lg:order-2 lg:hidden">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
            <li>
              <Link href={localizedHref(locale, "/")} className="transition-colors hover:text-ink">
                {dict.pdp.breadcrumbHome}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={localizedHref(locale, product.backHref)}
                className="transition-colors hover:text-ink"
              >
                {product.backLabel}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="order-3 space-y-6 lg:order-1 lg:col-span-6 lg:sticky lg:top-24 lg:self-start xl:col-span-5">
          <nav aria-label="Breadcrumb" className="hidden lg:block">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
              <li>
                <Link href={localizedHref(locale, "/")} className="transition-colors hover:text-ink">
                  {dict.pdp.breadcrumbHome}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={localizedHref(locale, product.backHref)}
                  className="transition-colors hover:text-ink"
                >
                  {product.backLabel}
                </Link>
              </li>
            </ol>
          </nav>

          <div>
            <BrandLogo brand={product.brand} size="sm" className="mb-3" />
            <h1 className="heading-product !normal-case text-2xl sm:text-3xl lg:text-[2.75rem]">
              {product.name}
            </h1>
            {(product.tagline || product.shortDescription) && (
              <p className="mt-3 text-base leading-relaxed text-ink/65">
                {product.tagline || product.shortDescription}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <FinancingPriceTeaser
              price={product.price}
              variant="compact"
              priceVariant="xl"
            />
          </div>

          {showColorPicker ? (
            <EquipmentColorPicker
              options={colorOptions}
              value={color}
              onChange={setColor}
              label={dict.pdp.color}
            />
          ) : null}

          {sizes.length > 1 ||
          (sizes[0] && sizes[0].toLowerCase() !== "one size") ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-ink">{dict.pdp.size}</p>
                {sizeGuide ? (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 underline-offset-2 transition-colors hover:text-accent hover:underline"
                  >
                    {dict.pdp.sizeGuide}
                  </button>
                ) : null}
              </div>
              <div
                className={
                  hasCompoundSizes
                    ? "mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
                    : "mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5"
                }
              >
                {sizes.map((option) => {
                  const parts = formatSizeButtonParts(option);

                  return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`min-h-11 min-w-0 border px-1.5 py-2 text-center font-body leading-tight transition-colors ${
                      hasCompoundSizes
                        ? "text-[10px] font-semibold tracking-normal whitespace-normal"
                        : "text-xs font-bold uppercase tracking-aggressive"
                    } ${
                      size === option
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/20 text-ink hover:border-ink"
                    }`}
                  >
                    {parts.length > 1
                      ? parts.map((part) => (
                          <span key={part} className="block">
                            {part}
                          </span>
                        ))
                      : parts[0]}
                  </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <EquipmentReturnPromise className="pt-1" />

          <div className="space-y-3 pt-2" ref={atcSentinelRef}>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              className="flex min-h-12 w-full items-center justify-center bg-ink px-6 font-body text-[11px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {product.inStock
                ? added
                  ? dict.pdp.addedToCart
                  : dict.pdp.addToCart
                : dict.search.soldOut}
            </button>
            {product.inStock ? (
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex min-h-11 w-full items-center justify-center border border-ink/20 text-xs text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                {dict.pdp.buyNow}
              </button>
            ) : null}
            <div className="flex items-center gap-6">
              <WishlistButton
                variant="text"
                item={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: activeColorImage,
                  brand: product.brand,
                  type: product.type,
                  productId: product.databaseId,
                }}
              />
              <ShareButton title={product.name} />
            </div>
          </div>

        </div>

        <div className="order-2 flex flex-col gap-8 max-lg:contents lg:order-2 lg:col-span-6 xl:col-span-7">
          <div className="order-2 w-full max-lg:order-1 lg:order-none lg:max-w-xl xl:max-w-2xl lg:ml-auto lg:w-full">
            <ProductImageGallery
              images={galleryImages}
              alt={product.name}
              variant="scene"
              theme="light"
              layout="craft"
              imageBackground="detail"
              fullBleedMobile
            />
          </div>

          <div className="order-4 w-full max-w-md space-y-8 sm:max-w-lg lg:order-none lg:ml-auto lg:w-full lg:max-w-xl xl:max-w-2xl">
          {isVideoSrc(product.lifestyleImage) ? (
            <figure className="relative aspect-[16/9] overflow-hidden bg-detail">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                src={product.lifestyleImage}
                className="absolute inset-0 h-full w-full object-cover"
                aria-label={`${product.name} lifestyle video`}
              />
            </figure>
          ) : null}

          {(product.descriptionHtml || product.description) && (
            <section aria-labelledby="product-description-heading">
              <h2
                id="product-description-heading"
                className="font-body text-[11px] font-bold uppercase tracking-aggressive text-ink"
              >
                {dict.pdp.description}
              </h2>
              <div className="relative mt-4">
                <div
                  className="overflow-hidden transition-[max-height] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    maxHeight:
                      descriptionExpanded || !hasLongDescription
                        ? `${descriptionMaxHeight || 2000}px`
                        : "7rem",
                  }}
                >
                  <div ref={descriptionBodyRef}>
                    {product.descriptionHtml ? (
                      <div
                        className="product-description text-base leading-relaxed text-ink/70 [&_p]:mb-3"
                        dangerouslySetInnerHTML={{
                          __html: product.descriptionHtml,
                        }}
                      />
                    ) : (
                      <p className="text-base leading-relaxed text-ink/70">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
                {hasLongDescription && !descriptionExpanded ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-detail to-transparent"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {hasLongDescription ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((open) => !open)}
                  className="mt-3 text-sm font-medium text-ink underline-offset-2 transition-colors hover:text-accent hover:underline"
                >
                  {descriptionExpanded ? dict.pdp.readLess : dict.pdp.readMore}
                </button>
              ) : null}
            </section>
          )}

          <div className="border-b border-ink/10">
            {product.features.length > 0 ? (
              <CraftAccordion
                title={dict.pdp.features}
                open={activeAccordion === "features"}
                onOpenChange={(open) =>
                  setActiveAccordion(open ? "features" : null)
                }
              >
                <ul className="flex flex-wrap gap-2">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="border border-ink/10 px-3 py-1.5 text-sm text-ink/70"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </CraftAccordion>
            ) : null}

            {product.specs.length > 0 ? (
              <CraftAccordion
                title={dict.pdp.specifications}
                open={activeAccordion === "specifications"}
                onOpenChange={(open) =>
                  setActiveAccordion(open ? "specifications" : null)
                }
              >
                <ProductSpecs specs={product.specs} />
              </CraftAccordion>
            ) : null}

            <CraftAccordion
              title={dict.pdp.shippingReturns}
              open={activeAccordion === "shipping"}
              onOpenChange={(open) =>
                setActiveAccordion(open ? "shipping" : null)
              }
            >
              <ProductShippingReturnsPanel
                productId={product.databaseId}
                variationId={firstVariationId(product)}
                defaultCountry={defaultShippingCountry}
                active={activeAccordion === "shipping"}
              />
            </CraftAccordion>
          </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    {relatedProducts.length > 0 ? (
      <RelatedProducts products={relatedProducts} />
    ) : null}

    <RecentlyViewedProducts excludeSlug={product.slug} />

    {sizeGuide ? (
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        guide={sizeGuide}
        selectedSize={size}
      />
    ) : null}

    <EquipmentStickyAtc
      name={product.name}
      price={product.price}
      inStock={product.inStock}
      added={added}
      visible={stickyAtcVisible}
      onAdd={handleAdd}
    />
    </>
  );
}
