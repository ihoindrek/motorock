"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useCart, cartLineKey } from "@/context/cart-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { localizedProductHref } from "@/lib/shop/product-url";
import { getCartTotals } from "@/lib/shop/cart-totals";
import { cartLineThumbnailClass } from "@/lib/shop/cart-line-image";
import { formatPrice } from "@/lib/shop/category";
import { Price } from "@/components/shop/price";
import { cn } from "@/lib/utils";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";
import { CartDrawerSuggestions } from "@/components/shop/cart-drawer-suggestions";
import { FreeShippingNote } from "@/components/shop/free-shipping-note";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CartDrawer() {
  const {
    lines,
    itemCount,
    subtotal,
    drawerOpen,
    lastAddedLineKey,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();
  const locale = useLocale();
  const dict = useDictionary();
  const t =
    locale === "et"
      ? {
          closeCart: "Sulge ostukorv",
          shoppingCart: "Ostukorv",
          item: "toode",
          items: "toodet",
          emptyTitle: "Sinu ostukorv on tühi",
          emptyBody: "Lisa varustust või mootorratas — checkout võtab alla minuti.",
          shopEquipment: "Vaata varustust",
          shopMotorcycles: "Vaata mootorrattaid",
          remove: "Eemalda",
          decreaseQty: "Vähenda kogust",
          increaseQty: "Suurenda kogust",
          subtotal: "Vahesumma",
          shipping: "Tarne",
          shippingAtCheckout: "Arvutatakse kassas",
          total: "Kokku",
          checkout: "Kassa",
          continueShopping: "Jätka ostlemist",
          addedSuccess: "Toode lisati ostukorvi",
          cartSuggestions: "Soovitame ka",
        }
      : {
          closeCart: "Close cart",
          shoppingCart: "Shopping cart",
          item: "item",
          items: "items",
          emptyTitle: "Your cart is empty",
          emptyBody: "Add gear or a motorcycle — checkout takes under a minute.",
          shopEquipment: "Shop equipment",
          shopMotorcycles: "Shop motorcycles",
          remove: "Remove",
          decreaseQty: "Decrease quantity",
          increaseQty: "Increase quantity",
          subtotal: "Subtotal",
          shipping: "Shipping",
          shippingAtCheckout: "At checkout",
          total: "Total",
          checkout: "Checkout",
          continueShopping: "Continue shopping",
          addedSuccess: "Product added to your cart",
          cartSuggestions: "We also suggest",
        };
  const [mounted, setMounted] = useState(false);

  const cartSlugs = useMemo(
    () => [...new Set(lines.map((line) => line.slug))],
    [lines],
  );

  const suggestionSourceSlug = useMemo(() => {
    if (lastAddedLineKey) {
      const added = lines.find(
        (line) => cartLineKey(line) === lastAddedLineKey,
      );
      if (added) {
        return added.slug;
      }
    }

    return lines.at(-1)?.slug ?? null;
  }, [lastAddedLineKey, lines]);

  const sortedLines = useMemo(() => {
    if (!lastAddedLineKey) {
      return lines;
    }

    const highlighted = lines.filter(
      (line) => cartLineKey(line) === lastAddedLineKey,
    );
    const rest = lines.filter(
      (line) => cartLineKey(line) !== lastAddedLineKey,
    );

    return [...highlighted, ...rest];
  }, [lastAddedLineKey, lines]);

  const { total } = getCartTotals(subtotal);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeCart, drawerOpen]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t.closeCart}
        aria-hidden={!drawerOpen}
        tabIndex={drawerOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-[120] bg-ink/25 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none",
          drawerOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={closeCart}
      />

      <aside
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.shoppingCart}
        aria-hidden={!drawerOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-[121] flex w-full max-w-md flex-col border-l border-ink/10 bg-paper shadow-[-24px_0_80px_rgb(11_11_11_/_0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            <p className="heading-section">{dict.checkout.yourCart}</p>
            <p className="mt-2 font-body text-sm font-bold uppercase tracking-aggressive text-ink">
              {itemCount} {itemCount === 1 ? t.item : t.items}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex size-10 items-center justify-center text-ink/50 transition-colors hover:text-accent"
          >
            <span className="sr-only">{t.closeCart}</span>
            <CloseIcon />
          </button>
        </div>

        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="font-body text-xl font-extrabold uppercase tracking-tight text-ink">
              {t.emptyTitle}
            </p>
            <p className="mt-3 max-w-xs text-sm text-ink/60">
              {t.emptyBody}
            </p>
            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              <Link
                href={localizedHref(locale, buildEquipmentHubHref(locale))}
                onClick={closeCart}
                className="btn-accent justify-center"
              >
                {t.shopEquipment}
              </Link>
              <Link
                href={localizedHref(locale, "/shop/motorcycles")}
                onClick={closeCart}
                className="btn-ghost justify-center"
              >
                {t.shopMotorcycles}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {lastAddedLineKey ? (
              <div className="border-b border-accent/20 bg-accent/5 px-5 py-3 sm:px-6">
                <p className="flex items-center gap-2 font-body text-sm font-bold text-ink">
                  <span
                    className="inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-paper"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {t.addedSuccess}
                </p>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="divide-y divide-ink/10 px-5 sm:px-6">
                {sortedLines.map((line) => {
                if (!line.name || !line.image) {
                  return null;
                }

                const lineTotal = line.price * line.quantity;
                const thumbnail = cartLineThumbnailClass(line);
                const isHighlighted = cartLineKey(line) === lastAddedLineKey;

                return (
                  <li
                    key={cartLineKey(line)}
                    className={cn(
                      "flex gap-4 py-5 first:pt-5",
                      isHighlighted && "bg-accent/[0.03]",
                    )}
                  >
                    <Link
                      href={localizedProductHref(line.slug, locale)}
                      onClick={closeCart}
                      className={cn(
                        "relative w-20 shrink-0 overflow-hidden rounded-sm border border-ink/10",
                        thumbnail.frame,
                      )}
                    >
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className={thumbnail.image}
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {line.brand ? (
                            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                              {line.brand}
                            </p>
                          ) : null}
                          <Link
                            href={localizedProductHref(line.slug, locale)}
                            onClick={closeCart}
                            className="mt-1 block truncate text-sm font-bold leading-snug hover:text-accent"
                          >
                            {line.name}
                          </Link>
                          {line.size ? (
                            <p className="mt-1 text-xs text-ink/55">
                              {dict.pdp.size}: {line.size}
                            </p>
                          ) : null}
                          {line.color ? (
                            <p className="text-xs text-ink/55">
                              {dict.pdp.color}: {line.color}
                            </p>
                          ) : null}
                        </div>
                        <Price value={lineTotal} variant="sm" as="p" className="shrink-0" />
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center border border-ink/15">
                          <button
                            type="button"
                            aria-label={t.decreaseQty}
                            onClick={() =>
                              updateQuantity(
                                line.slug,
                                line.quantity - 1,
                                line.size,
                                line.color,
                                line.legLength,
                              )
                            }
                            className="px-2.5 py-1.5 text-ink/70 transition-colors hover:text-accent"
                          >
                            −
                          </button>
                          <span className="min-w-7 text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={t.increaseQty}
                            onClick={() =>
                              updateQuantity(
                                line.slug,
                                line.quantity + 1,
                                line.size,
                                line.color,
                                line.legLength,
                              )
                            }
                            className="px-2.5 py-1.5 text-ink/70 transition-colors hover:text-accent"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              line.slug,
                              line.size,
                              line.color,
                              line.legLength,
                            )
                          }
                          className="text-xs text-ink/45 underline-offset-2 hover:text-accent hover:underline"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>

              <div className="border-t border-ink/10 px-5 pt-5 sm:px-6">
                <CartDrawerSuggestions
                  sourceSlug={suggestionSourceSlug}
                  excludeSlugs={cartSlugs}
                  title={t.cartSuggestions}
                  onNavigate={closeCart}
                />
              </div>

              <div className="my-8 border-y border-ink/10 px-5 py-6 sm:px-6">
                <CampaignCartPanels
                  placement="cart-drawer"
                  variant="compact"
                  flat
                  ctaVariant="link"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-ink/10 bg-surface/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <FreeShippingNote
                subtotal={subtotal}
                variant="progress"
                className="mb-4"
              />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/65">{t.subtotal}</dt>
                  <dd className="font-body font-extrabold tabular-nums">
                    {formatPrice(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/65">{t.shipping}</dt>
                  <dd className="font-body text-sm text-ink/55">
                    {t.shippingAtCheckout}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                  <dt className="font-bold">{t.total}</dt>
                  <dd className="font-body font-bold tabular-nums">
                    <Price value={total} variant="md" />
                  </dd>
                </div>
              </dl>

              <Link
                href={localizedHref(locale, "/cart")}
                onClick={closeCart}
                className="btn-accent mt-5 w-full justify-center"
              >
                {t.checkout}
              </Link>
              <Link
                href={localizedHref(locale, buildEquipmentHubHref(locale))}
                onClick={closeCart}
                className="mt-3 block text-center font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
              >
                {t.continueShopping}
              </Link>
            </div>
          </>
        )}
      </aside>
    </>,
    document.body,
  );
}
