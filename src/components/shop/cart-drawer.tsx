"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/cart-context";
import { getCartTotals, SHIPPING_THRESHOLD } from "@/lib/shop/cart-totals";
import { cartLineThumbnailClass } from "@/lib/shop/cart-line-image";
import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";

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
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();
  const [mounted, setMounted] = useState(false);

  const { shipping, total } = getCartTotals(subtotal);

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
        aria-label="Close cart"
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
        aria-label="Shopping cart"
        aria-hidden={!drawerOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-[121] flex w-full max-w-md flex-col border-l border-ink/10 bg-paper shadow-[-24px_0_80px_rgb(11_11_11_/_0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-5 sm:px-6">
          <div>
            <p className="heading-section">Cart</p>
            <p className="mt-2 font-display text-sm font-bold uppercase tracking-aggressive text-ink">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex size-10 items-center justify-center text-ink/50 transition-colors hover:text-accent"
          >
            <span className="sr-only">Close cart</span>
            <CloseIcon />
          </button>
        </div>

        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="font-display text-xl font-extrabold uppercase tracking-tight text-ink">
              Your cart is empty
            </p>
            <p className="mt-3 max-w-xs text-sm text-ink/60">
              Add gear or a motorcycle — checkout takes under a minute.
            </p>
            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              <Link
                href="/shop/equipment"
                onClick={closeCart}
                className="btn-accent justify-center"
              >
                Shop equipment
              </Link>
              <Link
                href="/shop/motorcycles"
                onClick={closeCart}
                className="btn-ghost justify-center"
              >
                Shop motorcycles
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-ink/10 overflow-y-auto overscroll-contain px-5 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {lines.map((line) => {
                if (!line.name || !line.image) {
                  return null;
                }

                const lineTotal = line.price * line.quantity;
                const thumbnail = cartLineThumbnailClass(line);

                return (
                  <li
                    key={`${line.slug}:${line.size ?? ""}`}
                    className="flex gap-4 py-5 first:pt-5"
                  >
                    <Link
                      href={`/shop/product/${line.slug}`}
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
                            <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                              {line.brand}
                            </p>
                          ) : null}
                          <Link
                            href={`/shop/product/${line.slug}`}
                            onClick={closeCart}
                            className="mt-1 block truncate text-sm font-bold leading-snug hover:text-accent"
                          >
                            {line.name}
                          </Link>
                          {line.size ? (
                            <p className="mt-1 text-xs text-ink/55">
                              Size: {line.size}
                            </p>
                          ) : null}
                          {line.color ? (
                            <p className="text-xs text-ink/55">
                              Colour: {line.color}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 font-display text-sm font-bold tabular-nums">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center border border-ink/15">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(
                                line.slug,
                                line.quantity - 1,
                                line.size,
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
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(
                                line.slug,
                                line.quantity + 1,
                                line.size,
                              )
                            }
                            className="px-2.5 py-1.5 text-ink/70 transition-colors hover:text-accent"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(line.slug, line.size)}
                          className="text-xs text-ink/45 underline-offset-2 hover:text-accent hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <CampaignCartPanels
              placement="cart-drawer"
              variant="compact"
              className="mb-4 px-5 sm:px-6"
            />

            <div className="border-t border-ink/10 bg-surface/50 px-5 py-5 sm:px-6">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/65">Subtotal</dt>
                  <dd className="font-bold tabular-nums">
                    {formatPrice(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/65">Shipping</dt>
                  <dd className="font-bold tabular-nums">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </dd>
                </div>
                {subtotal > 0 && subtotal < SHIPPING_THRESHOLD ? (
                  <p className="text-xs text-ink/50">
                    Free shipping over {formatPrice(SHIPPING_THRESHOLD)}
                  </p>
                ) : null}
                <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-display font-bold tabular-nums">
                    {formatPrice(total)}
                  </dd>
                </div>
              </dl>

              <Link
                href="/cart"
                onClick={closeCart}
                className="btn-accent mt-5 w-full justify-center"
              >
                Checkout
              </Link>
              <Link
                href="/shop/equipment"
                onClick={closeCart}
                className="mt-3 block text-center font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
              >
                Continue shopping
              </Link>
            </div>
          </>
        )}
      </aside>
    </>,
    document.body,
  );
}
