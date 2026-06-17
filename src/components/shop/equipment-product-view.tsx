"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/shop/category";
import { sortProductSizes } from "@/lib/shop/sort-sizes";
import { SHIPPING_THRESHOLD } from "@/lib/shop/cart-totals";
import { BrandLogo } from "@/components/shop/brand-logo";
import { FinancingPriceTeaser } from "@/components/shop/financing-price-teaser";
import { ProductImageGallery } from "@/components/shop/product-image-gallery";
import { ProductSpecs } from "@/components/shop/product-specs";
import { RelatedProducts } from "@/components/shop/related-products";
import { EquipmentReturnPromise } from "@/components/shop/equipment-return-promise";
import { ShowroomPickupNote } from "@/components/shop/showroom-pickup-panel";
import { SizeGuideModal } from "@/components/shop/size-guide-modal";
import { EquipmentColorPicker } from "@/components/shop/equipment-color-picker";
import { resolveSizeGuide } from "@/lib/shop/resolve-size-guide";
import {
  buildProductColorOptions,
  hasMultipleColorChoices,
  getSelectableColors,
} from "@/lib/shop/product-color-swatches";

type EquipmentProductViewProps = {
  product: CatalogProduct;
  relatedProducts?: readonly CatalogProduct[];
};

function isVideoSrc(src: string) {
  return src.endsWith(".mp4") || src.endsWith(".webm");
}

function CraftAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group border-t border-ink/10"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[11px] font-bold uppercase tracking-aggressive text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span
          className="text-lg font-normal leading-none text-ink/40 transition-transform duration-200 group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

export function EquipmentProductView({
  product,
  relatedProducts = [],
}: EquipmentProductViewProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const sizes = useMemo(
    () => sortProductSizes(product.sizes),
    [product.sizes],
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
  const [size, setSize] = useState(() => sortProductSizes(product.sizes)[0]);
  const [color, setColor] = useState(() => selectableColors[0] ?? "");
  const [added, setAdded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const sizeGuide = useMemo(() => resolveSizeGuide(product), [product]);

  useEffect(() => {
    setSize(sizes[0]);
  }, [product.slug, sizes]);

  useEffect(() => {
    setColor(selectableColors[0] ?? "");
  }, [product.slug, selectableColors]);

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
    variationId:
      product.variationIds?.[size] ?? product.variationIds?.[color],
  };

  const handleAdd = () => {
    addItem(cartPayload);
    openCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(cartPayload);
    router.push("/cart");
  };

  const handleCheckoutFinancing = () => {
    addItem(cartPayload);
    router.push("/checkout");
  };

  return (
    <>
    <div className="bg-detail">
      <div className="site-container max-lg:pt-0 py-6 lg:py-10">
      <div className="flex flex-col gap-10 max-lg:gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <nav aria-label="Breadcrumb" className="order-1 max-lg:order-2 lg:hidden">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={product.backHref}
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
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={product.backHref}
                  className="transition-colors hover:text-ink"
                >
                  {product.backLabel}
                </Link>
              </li>
            </ol>
          </nav>

          <div>
            <BrandLogo brand={product.brand} size="sm" className="mb-3" />
            <h1 className="heading-product !normal-case text-xl sm:text-2xl lg:text-[2.25rem]">
              {product.name}
            </h1>
            {(product.tagline || product.shortDescription) && (
              <p className="mt-3 text-sm leading-relaxed text-ink/60">
                {product.tagline || product.shortDescription}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <FinancingPriceTeaser
              price={product.price}
              productType="equipment"
              productName={product.name}
              variant="compact"
              onCheckout={handleCheckoutFinancing}
            />
            {product.inStock ? (
              <p className="flex items-center gap-2 text-xs text-ink/60">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-emerald-600"
                  aria-hidden="true"
                />
                In stock
              </p>
            ) : (
              <p className="text-xs text-ink/50">Contact us for availability</p>
            )}
          </div>

          {showColorPicker ? (
            <EquipmentColorPicker
              options={colorOptions}
              value={color}
              onChange={setColor}
            />
          ) : null}

          {sizes.length > 1 || sizes[0] !== "One size" ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-ink">Size</p>
                {sizeGuide ? (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45 underline-offset-2 transition-colors hover:text-accent hover:underline"
                  >
                    Size guide
                  </button>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`min-h-11 border px-1 py-2 text-center font-display text-xs font-bold uppercase tracking-aggressive transition-colors ${
                      size === option
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/20 text-ink hover:border-ink"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <EquipmentReturnPromise className="pt-1" />
          <ShowroomPickupNote className="pt-2" />

          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              className="flex min-h-12 w-full items-center justify-center bg-ink px-6 font-display text-[11px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {product.inStock
                ? added
                  ? "Added to cart"
                  : "Add to cart"
                : "Sold out"}
            </button>
            {product.inStock ? (
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex min-h-11 w-full items-center justify-center border border-ink/20 text-xs text-ink/70 transition-colors hover:border-ink hover:text-ink"
              >
                Buy now
              </button>
            ) : null}
          </div>

          <p className="text-[11px] leading-relaxed text-ink/45">
            Free shipping on orders over {formatPrice(SHIPPING_THRESHOLD)}. Montonio
            pay later & järelmaks at checkout.
          </p>
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
                className="font-display text-[11px] font-bold uppercase tracking-aggressive text-ink"
              >
                Product description
              </h2>
              {product.descriptionHtml ? (
                <div
                  className={`product-description mt-4 text-sm leading-relaxed text-ink/70 [&_p]:mb-3 ${
                    !descriptionExpanded && hasLongDescription
                      ? "max-h-28 overflow-hidden"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <p
                  className={`mt-4 text-sm leading-relaxed text-ink/70 ${
                    !descriptionExpanded && hasLongDescription
                      ? "line-clamp-4"
                      : ""
                  }`}
                >
                  {product.description}
                </p>
              )}
              {hasLongDescription ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((open) => !open)}
                  className="mt-3 text-xs font-medium text-ink underline-offset-2 hover:underline"
                >
                  {descriptionExpanded ? "Show less" : "Show more"}
                </button>
              ) : null}
            </section>
          )}

          <div className="border-b border-ink/10">
            {product.features.length > 0 ? (
              <CraftAccordion title="Features">
                <ul className="flex flex-wrap gap-2">
                  {product.features.map((feature) => (
                    <li
                      key={feature}
                      className="border border-ink/10 px-3 py-1.5 text-xs text-ink/70"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </CraftAccordion>
            ) : null}

            {product.specs.length > 0 ? (
              <CraftAccordion title="Specifications">
                <ProductSpecs specs={product.specs} />
              </CraftAccordion>
            ) : null}

            <CraftAccordion title="Delivery & returns">
              <p className="text-sm leading-relaxed text-ink/65">
                Standard delivery across Estonia and the EU. Returns accepted on
                unworn items within 14 days — contact us to arrange a return.
              </p>
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

    {sizeGuide ? (
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        guide={sizeGuide}
        selectedSize={size}
      />
    ) : null}
    </>
  );
}
