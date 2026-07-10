"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { MorphLoading } from "@/components/ui/morph-loading";
import { localizedHref } from "@/i18n/paths";
import type { OrderSummary } from "@/app/api/order/summary/route";
import { formatPrice } from "@/lib/shop/category";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

type OrderThankYouViewProps = {
  locale: "en" | "et";
  orderId: string;
  orderKey?: string;
};

function copy(locale: "en" | "et") {
  return locale === "et"
    ? {
        eyebrow: "Tellimus kinnitatud",
        title: "Aitäh!",
        loading: "Laen tellimuse kokkuvõtet…",
        error: "Tellimuse kokkuvõtet ei õnnestunud laadida.",
        sentTo: "Kinnitus saadetakse e-postile",
        orderNumber: "Tellimuse number",
        total: "Kokku",
        payment: "Makseviis",
        shipping: "Tarne",
        items: "Tooted",
        backHome: "Tagasi avalehele",
        continueShopping: "Jätka ostlemist",
        pending:
          "Makse on töötlemisel. Kui kinnitus ei jõua mõne minuti jooksul, võta meiega ühendust.",
        summaryUnavailable:
          "Tellimus {order} on vastu võetud. Kinnitus saadetakse sinu e-postile.",
      }
    : {
        eyebrow: "Order confirmed",
        title: "Thank you!",
        loading: "Loading your order summary…",
        error: "Could not load the order summary.",
        sentTo: "Confirmation will be sent to",
        orderNumber: "Order number",
        total: "Total",
        payment: "Payment",
        shipping: "Delivery",
        items: "Items",
        backHome: "Back to home",
        continueShopping: "Continue shopping",
        pending:
          "Your payment is still processing. Contact us if you do not receive confirmation within a few minutes.",
        summaryUnavailable:
          "Order {order} has been received. A confirmation will be sent to your email.",
      };
}

export function OrderThankYouView({
  locale,
  orderId,
  orderKey,
}: OrderThankYouViewProps) {
  const t = copy(locale);
  const { clearCart } = useCart();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderKey) {
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      const key = orderKey;
      if (!key) {
        return;
      }

      try {
        const params = new URLSearchParams({ order: orderId, key });
        const response = await fetch(`/api/order/summary?${params}`);
        const payload = (await response.json()) as OrderSummary & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? t.error);
        }

        if (!cancelled) {
          setSummary(payload);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : t.error);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [orderId, orderKey, t.error]);

  return (
    <div className="site-container py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="section-eyebrow text-accent">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase sm:text-4xl">
          {t.title}
        </h1>
      </div>

      <div className="mx-auto mt-10 max-w-2xl border border-ink/10 bg-white p-6 sm:p-8">
        {!orderKey ? (
          <p className="text-center text-sm text-ink/70">
            {t.summaryUnavailable.replace("{order}", orderId)}
          </p>
        ) : null}

        {orderKey && !summary && !error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <MorphLoading size="md" />
            <p className="text-sm text-ink/55">{t.loading}</p>
          </div>
        ) : null}

        {orderKey && error ? (
          <p className="text-center text-sm text-accent">{error}</p>
        ) : null}

        {summary ? (
          <div className="space-y-6 text-left">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                  {t.orderNumber}
                </p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {summary.orderNumber}
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                  {t.total}
                </p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {formatPrice(summary.total, locale)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                  {t.payment}
                </p>
                <p className="mt-1 text-sm text-ink/75">{summary.paymentMethod}</p>
              </div>
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                  {t.shipping}
                </p>
                <p className="mt-1 text-sm text-ink/75">
                  {summary.shippingMethod || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                {t.items}
              </p>
              <ul className="mt-3 divide-y divide-ink/8">
                {summary.items.map((item) => (
                  <li
                    key={`${item.name}-${item.quantity}`}
                    className="flex items-start justify-between gap-4 py-3 text-sm"
                  >
                    <span className="text-ink">
                      {item.name}
                      <span className="text-ink/45"> × {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium text-ink">
                      {formatPrice(item.total, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="border-t border-ink/8 pt-4 text-sm text-ink/60">
              {t.sentTo}{" "}
              <span className="font-medium text-ink">{summary.email}</span>
            </p>

            {summary.status === "pending" || summary.status === "on-hold" ? (
              <p className="text-sm text-ink/55">{t.pending}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
        <Link href={localizedHref(locale, buildEquipmentHubHref(locale))} className="btn-accent">
          {t.continueShopping}
        </Link>
        <Link href={localizedHref(locale, "/")} className="btn-ghost">
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
