"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import { useCart } from "@/context/cart-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedProductHref } from "@/lib/shop/product-url";
import {
  buildQuickAddCartLine,
  getQuickAddSizes,
  isQuickAddSizeAvailable,
  type ProductQuickAddMode,
} from "@/lib/shop/product-quick-add";
import {
  formatSizeButtonParts,
  formatSizeLabel,
  isCompoundSizeLabel,
} from "@/lib/shop/size-label";
import { cn } from "@/lib/utils";

const SIZE_SLIDER_THRESHOLD = 6;
const SIZE_VIEW_ALL_THRESHOLD = 12;

const sizeScrollArrowClassName =
  "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-paper/50 bg-paper text-lg font-bold leading-none text-ink shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-[transform,background-color,border-color,color,opacity] hover:scale-105 hover:border-accent hover:bg-accent hover:text-paper disabled:pointer-events-none disabled:scale-100 disabled:border-paper/20 disabled:bg-paper/30 disabled:text-paper/50 disabled:opacity-100 disabled:shadow-none";

type ProductCardQuickAddProps = {
  product: CatalogProduct;
  mode: ProductQuickAddMode;
};

type QuickAddSizeButtonProps = {
  size: string;
  product: CatalogProduct;
  isAdded: boolean;
  onAdd: (size: string) => void;
};

function QuickAddSizeButton({
  size,
  product,
  isAdded,
  onAdd,
}: QuickAddSizeButtonProps) {
  const parts = formatSizeButtonParts(size);
  const available = isQuickAddSizeAvailable(product, size);

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onAdd(size)}
      className={cn(
        "min-h-9 shrink-0 border px-1.5 py-1.5 text-center font-body leading-tight transition-colors",
        isCompoundSizeLabel(size)
          ? "min-w-[3.25rem] max-w-[4.75rem] text-[9px] font-semibold tracking-normal whitespace-normal"
          : "min-w-[2.25rem] text-[11px] font-bold uppercase tracking-aggressive",
        available
          ? "border-paper/35 bg-paper/10 text-paper hover:border-accent hover:bg-accent"
          : "cursor-not-allowed border-paper/15 bg-paper/5 text-paper/35",
        isAdded && "border-accent bg-accent text-paper",
      )}
    >
      {isAdded
        ? "✓"
        : parts.length > 1
          ? parts.map((part) => (
              <span key={part} className="block">
                {part}
              </span>
            ))
          : parts[0]}
    </button>
  );
}

type QuickAddSizePickerProps = {
  product: CatalogProduct;
  sizes: readonly string[];
  addedSize: string | null;
  productHref: string;
  onAdd: (size: string) => void;
};

function QuickAddSizePicker({
  product,
  sizes,
  addedSize,
  productHref,
  onAdd,
}: QuickAddSizePickerProps) {
  const dict = useDictionary();
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const useSlider = sizes.length > SIZE_SLIDER_THRESHOLD;
  const showViewAllLink = sizes.length > SIZE_VIEW_ALL_THRESHOLD;

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node || !useSlider) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 4);
    setCanScrollNext(node.scrollLeft < maxScrollLeft - 4);
  }, [useSlider]);

  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollLastTimeRef = useRef<number>(0);

  const scrollSizes = useCallback(
    (direction: -1 | 1, behavior: ScrollBehavior = "smooth") => {
      scrollRef.current?.scrollBy({
        left: direction * 112,
        behavior,
      });
    },
    [],
  );

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(
    (direction: -1 | 1) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      stopAutoScroll();
      autoScrollLastTimeRef.current = performance.now();

      const tick = (now: number) => {
        const node = scrollRef.current;
        if (!node) {
          stopAutoScroll();
          return;
        }

        const deltaSeconds = Math.min((now - autoScrollLastTimeRef.current) / 1000, 0.05);
        autoScrollLastTimeRef.current = now;

        const maxScrollLeft = node.scrollWidth - node.clientWidth;
        const atEnd =
          direction === 1
            ? node.scrollLeft >= maxScrollLeft - 1
            : node.scrollLeft <= 1;

        if (atEnd) {
          stopAutoScroll();
          updateScrollState();
          return;
        }

        node.scrollLeft += direction * 140 * deltaSeconds;
        autoScrollFrameRef.current = window.requestAnimationFrame(tick);
      };

      autoScrollFrameRef.current = window.requestAnimationFrame(tick);
    },
    [stopAutoScroll, updateScrollState],
  );

  useEffect(() => {
    updateScrollState();
  }, [sizes, updateScrollState, useSlider]);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  return (
    <div className="mx-auto w-full max-w-[17rem]">
      <p className="mb-2.5 text-center font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/75">
        {dict.pdp.selectSize}
      </p>

      {useSlider ? (
        <div className="relative">
          <button
            type="button"
            aria-label={dict.catalog.previousSizes}
            onClick={() => scrollSizes(-1)}
            onMouseEnter={() => {
              if (canScrollPrev) {
                startAutoScroll(-1);
              }
            }}
            onMouseLeave={() => {
              stopAutoScroll();
              updateScrollState();
            }}
            disabled={!canScrollPrev}
            className={`${sizeScrollArrowClassName} left-0`}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <ul
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-1.5 overflow-x-auto px-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sizes.map((size) => (
              <li key={size} className="shrink-0">
                <QuickAddSizeButton
                  size={size}
                  product={product}
                  isAdded={addedSize === formatSizeLabel(size)}
                  onAdd={onAdd}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            aria-label={dict.catalog.nextSizes}
            onClick={() => scrollSizes(1)}
            onMouseEnter={() => {
              if (canScrollNext) {
                startAutoScroll(1);
              }
            }}
            onMouseLeave={() => {
              stopAutoScroll();
              updateScrollState();
            }}
            disabled={!canScrollNext}
            className={`${sizeScrollArrowClassName} right-0`}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {sizes.map((size) => (
            <li key={size}>
              <QuickAddSizeButton
                size={size}
                product={product}
                isAdded={addedSize === formatSizeLabel(size)}
                onAdd={onAdd}
              />
            </li>
          ))}
        </ul>
      )}

      {showViewAllLink ? (
        <Link
          href={productHref}
          prefetch
          scroll
          className="mt-2.5 block text-center font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/80 underline-offset-2 transition-colors hover:text-accent hover:underline"
        >
          {dict.catalog.viewAllSizes} →
        </Link>
      ) : null}
    </div>
  );
}

export function ProductCardQuickAdd({
  product,
  mode,
}: ProductCardQuickAddProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const { addItemAndOpenCart } = useCart();
  const [addedSize, setAddedSize] = useState<string | null>(null);
  const [addedSingle, setAddedSingle] = useState(false);
  const productHref = localizedProductHref(product.slug, locale);
  const sizes = useMemo(() => getQuickAddSizes(product), [product]);

  if (mode === "none") {
    return null;
  }

  const handleAdd = (size?: string) => {
    addItemAndOpenCart(buildQuickAddCartLine(product, size));

    if (size) {
      setAddedSize(formatSizeLabel(size));
      window.setTimeout(() => setAddedSize(null), 1500);
      return;
    }

    setAddedSingle(true);
    window.setTimeout(() => setAddedSingle(false), 1500);
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-2 opacity-0 transition-all duration-300 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="bg-gradient-to-t from-ink/55 via-ink/35 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
        {mode === "sizes" ? (
          <QuickAddSizePicker
            product={product}
            sizes={sizes}
            addedSize={addedSize}
            productHref={productHref}
            onAdd={handleAdd}
          />
        ) : mode === "single" ? (
          <button
            type="button"
            onClick={() => handleAdd()}
            className="mx-auto flex min-h-10 w-full max-w-[14rem] items-center justify-center bg-accent px-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent-hover sm:text-[11px]"
          >
            {addedSingle ? dict.pdp.addedToCart : dict.pdp.addToCart}
          </button>
        ) : (
          <Link
            href={productHref}
            prefetch
            scroll
            className="mx-auto flex min-h-10 w-full max-w-[14rem] items-center justify-center border border-paper/35 bg-paper/10 px-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:border-accent hover:bg-accent sm:text-[11px]"
          >
            {dict.catalog.quickView}
          </Link>
        )}
      </div>
    </div>
  );
}
