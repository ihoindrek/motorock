"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useCart, type CartLine } from "@/context/cart-context";
import { useCheckoutStep } from "@/context/checkout-step-context";
import {
  deriveCheckoutProgressStep,
  scrollToCheckoutStep,
} from "@/lib/checkout/progress-step";
import {
  focusDeliveryField,
  validateDelivery,
  type DeliveryField,
} from "@/lib/checkout/delivery-validation";
import { resolveSubmitBlockReason } from "@/lib/checkout/submit-block-reason";
import {
  clearCheckoutDraft,
  clearCheckoutPaymentRedirect,
  hasRecentCheckoutPaymentRedirect,
  markCheckoutPaymentRedirect,
  readCheckoutDraft,
  writeCheckoutDraft,
} from "@/lib/checkout/checkout-draft";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { localizedProductHref } from "@/lib/shop/product-url";
import {
  countryLabel,
  useCheckoutShipping,
} from "@/hooks/use-checkout-shipping";
import { useCheckoutPayment } from "@/hooks/use-checkout-payment";
import { useMontonioPaymentOptions } from "@/hooks/use-montonio-payment-options";
import { isLiveCheckoutEnabled } from "@/lib/checkout-mode";
import {
  buildMontonioCheckoutMetaData,
  isMontonioPaymentGateway,
  pickupPointReadyForCheckout,
  shouldRunMontonioPaymentRemint,
} from "@/lib/checkout/montonio-checkout";
import {
  buildCheckoutInputAddresses,
  resetCheckoutSyncState,
  submitCheckout,
  updateCheckoutCustomerShipping,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  CheckoutOrderSummary,
  CheckoutSummaryShell,
} from "@/components/shop/checkout-order-summary";
import { CheckoutMobileDeliveryTotals } from "@/components/shop/checkout-mobile-trust";
import { CheckoutMobileSection } from "@/components/shop/checkout-mobile-section";
import {
  CheckoutShippingOptions,
  CheckoutShippingOptionsSkeleton,
} from "@/components/shop/checkout-shipping-options";
import { formatColorLabel } from "@/lib/shop/product-color-swatches";
import { cartLineThumbnailClass } from "@/lib/shop/cart-line-image";
import { formatSizeLabel } from "@/lib/shop/size-label";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { localizeShippingRateLabel } from "@/lib/shop/localize-shipping-label";
import { Price } from "@/components/shop/price";
import { defaultLocationForCountry } from "@/lib/shop/countries";
import {
  formatPhoneWithCountryCode,
  stripCountryDialCode,
} from "@/lib/shop/phone";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBeginCheckout,
  trackCheckoutDraftRestored,
  trackCheckoutPaymentReturn,
  trackCheckoutSubmitBlocked,
  trackViewCart,
} from "@/lib/analytics";
import { CheckoutPaymentReturnBanner } from "@/components/shop/checkout-payment-return-banner";
import { cn } from "@/lib/utils";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";
import {
  resolveCheckoutDisplayTotal,
  resolveCheckoutShippingTotal,
} from "@/lib/checkout/shipping-total";
import { CheckoutPickupPointSelector } from "@/components/shop/checkout-pickup-point-selector";
import { CheckoutPhoneField } from "@/components/shop/checkout-phone-field";
import {
  CheckoutPaymentOptions,
  expandMontonioPaymentGateways,
  filterGatewaysWithMontonioOptions,
  filterMontonioOptionsForGateway,
  gatewayNeedsMontonioSubselection,
  isBankMontonioGateway,
} from "@/components/shop/checkout-payment-options";
import { CheckoutSupportNotice } from "@/components/shop/checkout-support-notice";
import {
  DeliveryFieldLabel,
  isDeliveryChecklistComplete,
} from "@/components/shop/checkout-delivery-field-label";
import {
  resolvePickupPointSources,
  shippingMethodNeedsPickupPoint,
} from "@/lib/shipping/pickup-carrier";
import type { PickupPoint } from "@/types/pickup-point";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import { montonioOptionKey, montonioOptionLabel } from "@/types/montonio-payment";

const FORM_ID = "checkout-form";

const inputClassName =
  "mt-2 w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none";

function inputWithErrorClass(hasError: boolean) {
  return cn(inputClassName, hasError && "border-accent");
}

const labelClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50";

function friendlyCheckoutError(
  message: string | null,
  fallback: string,
  locale: "en" | "et" = "en",
) {
  if (!message) {
    return null;
  }

  // Browser-level network failures (offline, backend briefly unreachable).
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) {
    return locale === "et"
      ? "Ühendus serveriga katkes. Kontrolli internetiühendust ja proovi uuesti."
      : "Connection to the server was lost. Check your internet connection and try again.";
  }

  if (/please select a pickup point/i.test(message)) {
    return locale === "et"
      ? "Valitud pakiautomaat ei jõudnud tellimusele. Värskenda lehte ja proovi uuesti."
      : "The selected pickup point could not be applied to your order. Refresh the page and try again.";
  }

  if (/could not load delivery options/i.test(message)) {
    return locale === "et"
      ? "Tarneviise ei saanud laadida. Vajuta „Proovi uuesti“ või lisa tooted ostukorvi uuesti tootelehelt."
      : "Could not load delivery options. Tap Retry or re-add items from the product page.";
  }

  if (/wrong number of segments|session.*expired|invalid session/i.test(message)) {
    return locale === "et"
      ? "Sessioon aegus. Vajuta „Proovi uuesti“."
      : "Your checkout session expired. Tap Retry.";
  }

  if (
    /product not found|choose a size|could not add items|could not add items to checkout|size is a required field/i.test(
      message,
    )
  ) {
    return message;
  }

  if (/invalid payment method/i.test(message)) {
    return locale === "et"
      ? "Valitud makseviis ei ole hetkel saadaval. Vali pangalink uuesti või värskenda lehte."
      : "The selected payment method is not available. Choose bank link again or refresh the page.";
  }

  if (
    message.includes("GraphQL") ||
    message.includes("HTTP") ||
    message.includes("Internal server")
  ) {
    return fallback;
  }

  return message;
}

function CartQuantityControl({
  value,
  onDecrease,
  onIncrease,
  compact = false,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  compact?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div
      className={cn(
        "relative max-w-full",
        compact ? "h-10 w-[104px]" : "mx-auto h-[50px] w-[120px]",
      )}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={onDecrease}
        className={cn(
          "absolute left-4 top-1/2 z-[2] -translate-y-1/2 leading-none text-ink transition-colors hover:text-accent",
          compact ? "text-xl" : "text-2xl",
        )}
      >
        −
      </button>
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-full border border-ink/12 bg-ink/[0.07] px-7 font-bold tabular-nums text-ink",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </div>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={onIncrease}
        className={cn(
          "absolute right-4 top-1/2 z-[2] -translate-y-1/2 leading-none text-ink transition-colors hover:text-accent",
          compact ? "text-xl" : "text-2xl",
        )}
      >
        +
      </button>
    </div>
  );
}

function CartLineMeta({ line }: { line: CartLine }) {
  const dict = useDictionary();
  const parts = [
    line.size ? `${dict.pdp.size}: ${formatSizeLabel(line.size)}` : null,
    line.color ? `${dict.pdp.color}: ${formatColorLabel(line.color)}` : null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return <p className="mt-1 text-xs text-ink/55 sm:text-sm">{parts.join(" · ")}</p>;
}

function CheckoutCartTable({
  lines,
  onDecrease,
  onIncrease,
  onRemove,
  locale,
  labels,
}: {
  lines: CartLine[];
  onDecrease: (line: CartLine) => void;
  onIncrease: (line: CartLine) => void;
  onRemove: (line: CartLine) => void;
  locale: "en" | "et";
  labels: {
    remove: string;
    image: string;
    product: string;
    quantity: string;
    sum: string;
    decrease: string;
    increase: string;
  };
}) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {lines.map((line) => {
          if (!line.name || !line.image) {
            return null;
          }

          const lineTotal = line.price * line.quantity;
          const thumbnail = cartLineThumbnailClass(line);

          return (
            <article
              key={`${line.slug}:${line.size ?? ""}`}
              className="flex gap-3"
            >
              <Link
                href={localizedProductHref(line.slug, locale)}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg max-md:border-0 max-md:bg-transparent",
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
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {line.brand ? (
                      <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                        {line.brand}
                      </p>
                    ) : null}
                    <Link
                      href={localizedProductHref(line.slug, locale)}
                      className="mt-0.5 block text-sm font-semibold leading-snug text-ink hover:text-accent"
                    >
                      {line.name}
                    </Link>
                    <CartLineMeta line={line} />
                  </div>
                  <Price value={lineTotal} variant="sm" as="p" className="shrink-0" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <CartQuantityControl
                    compact
                    value={line.quantity}
                    onDecrease={() => onDecrease(line)}
                    onIncrease={() => onIncrease(line)}
                    decreaseLabel={labels.decrease}
                    increaseLabel={labels.increase}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(line)}
                    className="text-xs text-ink/45 hover:text-accent"
                  >
                    {labels.remove}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden bg-surface/80 md:block">
        <div className="grid grid-cols-[120px_minmax(0,1fr)_120px_100px] items-end gap-x-6 border-b border-ink/10 px-5 py-4">
          <span className="sr-only">{labels.image}</span>
          <span className="text-sm font-semibold text-ink/55">{labels.product}</span>
          <span className="text-center text-sm font-semibold text-ink/55">
            {labels.quantity}
          </span>
          <span className="text-right text-sm font-semibold text-ink/55">{labels.sum}</span>
        </div>

        <ul className="divide-y divide-ink/10">
          {lines.map((line) => {
            if (!line.name || !line.image) {
              return null;
            }

            const lineTotal = line.price * line.quantity;
            const thumbnail = cartLineThumbnailClass(line);

            return (
              <li
                key={`${line.slug}:${line.size ?? ""}`}
                className="grid grid-cols-[120px_minmax(0,1fr)_120px_100px] items-center gap-x-6 p-5"
              >
                <Link
                  href={localizedProductHref(line.slug, locale)}
                  className={cn(
                    "relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-ink/10",
                    thumbnail.frame,
                  )}
                >
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="120px"
                    className={thumbnail.image}
                  />
                </Link>

                <div className="min-w-0">
                  {line.brand ? (
                    <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                      {line.brand}
                    </p>
                  ) : null}
                  <Link
                    href={localizedProductHref(line.slug, locale)}
                    className="mt-1 block text-base font-semibold leading-snug text-ink hover:text-accent"
                  >
                    {line.name}
                  </Link>
                  <CartLineMeta line={line} />
                  <button
                    type="button"
                    onClick={() => onRemove(line)}
                    className="mt-2 text-sm font-medium text-ink/50 transition-colors hover:text-accent"
                  >
                    {labels.remove}
                  </button>
                </div>

                <CartQuantityControl
                  value={line.quantity}
                  onDecrease={() => onDecrease(line)}
                  onIncrease={() => onIncrease(line)}
                  decreaseLabel={labels.decrease}
                  increaseLabel={labels.increase}
                />

                <Price value={lineTotal} variant="lg" as="p" className="text-right" />
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function CartCheckoutView() {
  const dict = useDictionary();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t =
    locale === "et"
      ? {
          orderConfirmed: "Tellimus kinnitatud",
          thankYou: "Aitäh",
          deliveryChosen: "sinu valitud tarnega",
          confirmationSent: "Saatsime kinnituse aadressile",
          orderOnItsWay:
            "Tellimus {order} on teel tarneviisiga {delivery}. {confirmation} {email}.",
          demoNotice:
            "Ainult demo checkout — tellimust ei loodud ja makset ei võetud.",
          backToHome: "Tagasi avalehele",
          emptyCart: "Sinu ostukorv on hetkel tühi.",
          backToShop: "Tagasi poodi",
          browseMotorcycles: "Sirvi mootorrattaid",
          checkout: "Kassa",
          item: "toode",
          items: "toodet",
          total: "kokku",
          haveDiscountCode: "Kas sul on sooduskood?",
          apply: "Rakenda",
          email: "E-post",
          country: "Riik",
          chooseCountry: "Vali riik",
          loadingCountries: "Laen riike…",
          chooseCountryForDelivery: "Vali riik, et näha tarneviise.",
          deliveryMethod: "Tarneviis",
          noDeliveryOptions:
            "Tarneviise ei saanud laadida. Vajuta „Proovi uuesti“ või tühjenda ostukorv ja lisa toode uuesti tootelehelt (vali suurus).",
          updatingPrices: "Uuendan hindu…",
          pickupAtPayment: "Pakiautomaadi valik tehakse turvaliselt makses.",
          streetAddress: "Tänava aadress",
          city: "Linn",
          postcode: "Postiindeks",
          firstName: "Eesnimi",
          lastName: "Perekonnanimi",
          phone: "Telefon",
          remove: "Eemalda",
          product: "Toode",
          quantity: "Kogus",
          sum: "Summa",
          image: "Pilt",
          termsPrefix: "Nõustun",
          termsLink: "tingimustega",
          paymentMethod: "Makseviis",
          paymentReturnError: "Makse katkestati või ebaõnnestus. Proovi uuesti.",
          testPayment: "Testi makset",
          testPaymentDone: "Makse test läbitud",
          testPaymentBody:
            "Valisid makseviisi „{method}“. WooCommerce'i tellimust ei loodud ja makset ei võetud.",
          backToCheckout: "Tagasi kassasse",
        }
      : {
          orderConfirmed: "Order confirmed",
          thankYou: "Thank you",
          deliveryChosen: "your chosen delivery",
          confirmationSent: "We sent a confirmation to",
          orderOnItsWay:
            "Order {order} is on its way via {delivery}. {confirmation} {email}.",
          demoNotice:
            "Demo checkout only — no order was placed and no payment was taken.",
          backToHome: "Back to home",
          emptyCart: "Your cart is currently empty.",
          backToShop: "Back to shop",
          browseMotorcycles: "Browse motorcycles",
          checkout: "Checkout",
          item: "item",
          items: "items",
          total: "total",
          haveDiscountCode: "Have a discount code?",
          apply: "Apply",
          email: "Email",
          country: "Country",
          chooseCountry: "Choose country",
          loadingCountries: "Loading countries…",
          chooseCountryForDelivery: "Choose a country to see delivery options.",
          deliveryMethod: "Delivery method",
          noDeliveryOptions:
            "Could not load delivery options. Tap Retry or clear your cart and re-add from the product page (choose a size).",
          updatingPrices: "Updating prices…",
          pickupAtPayment: "Pickup point is selected securely at payment.",
          streetAddress: "Street address",
          city: "City",
          postcode: "Postcode",
          firstName: "First name",
          lastName: "Last name",
          phone: "Phone",
          remove: "Remove",
          product: "Product",
          quantity: "Quantity",
          sum: "Sum",
          image: "Image",
          termsPrefix: "I agree to the",
          termsLink: "terms & conditions",
          paymentMethod: "Payment method",
          paymentReturnError: "Payment was cancelled or failed. Please try again.",
          testPayment: "Test payment",
          testPaymentDone: "Payment test complete",
          testPaymentBody:
            'You selected "{method}". No WooCommerce order was created and no payment was taken.',
          backToCheckout: "Back to checkout",
        };
  const {
    lines,
    itemCount,
    subtotal,
    hydrated: cartHydrated,
    updateQuantity,
    removeItem,
    clearCart,
    replaceCart,
  } = useCart();
  const [firstName, setFirstName] = useState(
    () => readCheckoutDraft()?.firstName ?? "",
  );
  const [lastName, setLastName] = useState(
    () => readCheckoutDraft()?.lastName ?? "",
  );
  const [email, setEmail] = useState(() => readCheckoutDraft()?.email ?? "");
  const [phone, setPhone] = useState(() => readCheckoutDraft()?.phone ?? "");
  const [phoneCountry, setPhoneCountry] = useState(
    () => readCheckoutDraft()?.phoneCountry ?? "",
  );
  const phoneCountryTouchedRef = useRef(false);
  const [address1, setAddress1] = useState(
    () => readCheckoutDraft()?.address1 ?? "",
  );
  const [city, setCity] = useState(() => readCheckoutDraft()?.city ?? "");
  const [postcode, setPostcode] = useState(
    () => readCheckoutDraft()?.postcode ?? "",
  );
  const [couponCode, setCouponCode] = useState("");
  const [mobileStepError, setMobileStepError] = useState<string | null>(null);
  const [deliveryValidationAttempted, setDeliveryValidationAttempted] =
    useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    1: true,
    2: false,
    3: false,
  });
  const sectionsInitializedRef = useRef(false);
  const draftRestoreCompletedRef = useRef(false);
  const isRestoringDraftRef = useRef(Boolean(readCheckoutDraft()));
  const pendingPaymentIdRef = useRef<string | null>(
    readCheckoutDraft()?.paymentId ?? null,
  );
  const pendingMontonioOptionKeyRef = useRef<string | null>(
    readCheckoutDraft()?.montonioOptionKey ?? null,
  );
  const pendingPickupPointRef = useRef(
    readCheckoutDraft()?.pickupPoint ?? null,
  );

  // Restore an abandoned order's cart from a payment reminder email link
  // (?restore=<orderId>&key=<orderKey>). The params are stripped right away
  // so a refresh doesn't re-run the restore over a possibly edited cart.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restoreOrder = params.get("restore");
    const restoreKey = params.get("key");

    if (!restoreOrder || !restoreKey) {
      return;
    }

    params.delete("restore");
    params.delete("key");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );

    const query2 = new URLSearchParams({ order: restoreOrder, key: restoreKey });
    void fetch(`/api/order/restore?${query2}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { lines?: CartLine[] } | null) => {
        if (payload?.lines?.length) {
          replaceCart(payload.lines);
        }
      })
      .catch(() => {
        // Restore is best-effort; the buyer still lands on a working checkout.
      });
  }, [replaceCart]);

  const [termsAccepted, setTermsAccepted] = useState(
    () => readCheckoutDraft()?.termsAccepted ?? false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentReturnBanner, setPaymentReturnBanner] = useState<
    "error" | "resume" | null
  >(() => (hasRecentCheckoutPaymentRedirect() ? "resume" : null));
  const [orderId, setOrderId] = useState<string | null>(null);
  const [previewPaymentTitle, setPreviewPaymentTitle] = useState<string | null>(
    null,
  );
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  const [selectedMontonioOption, setSelectedMontonioOption] =
    useState<MontonioPaymentOption | null>(null);
  const paymentGatewayTouchedRef = useRef(false);
  const checkoutAnalyticsRef = useRef({
    viewCart: false,
    beginCheckout: false,
    shipping: false,
    payment: false,
  });

  const customer = useMemo(
    () => ({
      email,
      firstName,
      lastName,
      phone,
      phoneCountry,
      address1,
      city,
      postcode,
    }),
    [email, firstName, lastName, phone, phoneCountry, address1, city, postcode],
  );

  const shipping = useCheckoutShipping(lines, customer, cartHydrated);
  const paymentCatalogReady =
    cartHydrated &&
    itemCount > 0 &&
    !shipping.loading &&
    Boolean(shipping.country);
  const montonioPreviewCountry = shipping.country;
  const paymentRefreshKey = `${shipping.country}:${shipping.selectedRateId ?? ""}:${shipping.rates.map((rate) => rate.id).join("|")}`;
  const payment = useCheckoutPayment(paymentCatalogReady, paymentRefreshKey);
  const hasMontonioGateway = useMemo(
    () =>
      payment.gateways.some((gateway) =>
        gateway.id.toLowerCase().includes("montonio"),
      ),
    [payment.gateways],
  );
  const montonio = useMontonioPaymentOptions(
    montonioPreviewCountry,
    paymentCatalogReady && hasMontonioGateway && isLiveCheckoutEnabled(),
  );
  const visiblePaymentGateways = useMemo(() => {
    if (!isLiveCheckoutEnabled() || !hasMontonioGateway || montonio.loading) {
      return payment.gateways;
    }

    return filterGatewaysWithMontonioOptions(
      expandMontonioPaymentGateways(payment.gateways, montonio.options, locale),
      montonio.options,
    );
  }, [
    hasMontonioGateway,
    locale,
    montonio.loading,
    montonio.options,
    payment.gateways,
  ]);
  const selectedPaymentGateway = useMemo(
    () =>
      visiblePaymentGateways.find((gateway) => gateway.id === payment.selectedId) ??
      payment.selectedGateway,
    [payment.selectedGateway, payment.selectedId, visiblePaymentGateways],
  );
  const montonioOptionsForGateway = useMemo(() => {
    if (!selectedPaymentGateway) {
      return [];
    }

    return filterMontonioOptionsForGateway(
      selectedPaymentGateway,
      montonio.options,
    );
  }, [montonio.options, selectedPaymentGateway]);
  const paymentLoading =
    paymentCatalogReady &&
    (payment.loading ||
      (hasMontonioGateway && isLiveCheckoutEnabled() && montonio.loading));
  const montonioSelected = Boolean(
    selectedPaymentGateway?.id?.toLowerCase().includes("montonio"),
  );
  const needsMontonioProvider =
    montonioSelected &&
    montonio.configured &&
    !montonio.loading &&
    Boolean(selectedPaymentGateway) &&
    gatewayNeedsMontonioSubselection(
      selectedPaymentGateway!,
      montonio.options,
    );
  const { setCheckoutStep, registerCheckoutStepNavigator, setPaymentStepReachable } = useCheckoutStep();

  const needsPickupPoint = shippingMethodNeedsPickupPoint(shipping.selectedRate);
  const pickupPointSources = useMemo(() => {
    if (!shipping.selectedRate || !needsPickupPoint) {
      return null;
    }

    return resolvePickupPointSources(shipping.selectedRate, shipping.country);
  }, [needsPickupPoint, shipping.country, shipping.selectedRate]);
  const requiresPickupSelection = needsPickupPoint && Boolean(pickupPointSources);

  const displaySubtotal = shipping.wcSubtotal ?? subtotal;
  const displayShipping = resolveCheckoutShippingTotal(
    shipping.shippingTotal,
    shipping.selectedRate,
  );
  const displayDiscount = shipping.discountTotal;
  const displayTotal = resolveCheckoutDisplayTotal({
    cartShippingTotal: shipping.shippingTotal,
    selectedRate: shipping.selectedRate,
    subtotal: displaySubtotal,
    discountTotal: displayDiscount,
    wcTotal: shipping.wcTotal,
  });

  useEffect(() => {
    if (itemCount === 0) {
      return;
    }

    if (!checkoutAnalyticsRef.current.viewCart) {
      checkoutAnalyticsRef.current.viewCart = true;
      trackViewCart(lines);
    }

    if (!checkoutAnalyticsRef.current.beginCheckout) {
      checkoutAnalyticsRef.current.beginCheckout = true;
      trackBeginCheckout(lines, displayTotal);
    }
  }, [displayTotal, itemCount, lines]);

  useEffect(() => {
    if (
      !payment.selectedId ||
      checkoutAnalyticsRef.current.payment ||
      !paymentGatewayTouchedRef.current
    ) {
      return;
    }

    checkoutAnalyticsRef.current.payment = true;
    trackAddPaymentInfo({
      lines,
      paymentType: payment.selectedId,
      value: displayTotal,
    });
  }, [displayTotal, lines, payment.selectedId]);

  async function handleApplyCoupon() {
    const code = couponCode.trim();
    if (!code || shipping.couponLoading) {
      return;
    }

    const result = await shipping.applyCoupon(code);
    if (result.ok) {
      setCouponCode("");
    }
  }

  const deliveryValidationMessages = useMemo(
    () => ({
      required: dict.checkout.fieldRequired,
      emailInvalid: dict.checkout.emailInvalid,
      checklistEmail: dict.checkout.deliveryChecklistEmail,
      checklistCountry: dict.checkout.deliveryChecklistCountry,
      checklistShipping: dict.checkout.deliveryChecklistShipping,
      checklistPickup: dict.checkout.deliveryChecklistPickup,
      checklistAddress: dict.checkout.deliveryChecklistAddress,
      checklistName: dict.checkout.deliveryChecklistName,
      checklistPhone: dict.checkout.deliveryChecklistPhone,
    }),
    [dict.checkout],
  );

  const deliveryValidation = useMemo(
    () =>
      validateDelivery(
        {
          email,
          firstName,
          lastName,
          phone,
          phoneCountry,
          address1,
          city,
          postcode,
          shippingCountry: shipping.country,
          selectedRateId: shipping.selectedRateId,
          needsAddress: shipping.needsAddress,
          needsPickupPoint: requiresPickupSelection,
          pickupPoint,
        },
        deliveryValidationMessages,
      ),
    [
      address1,
      city,
      deliveryValidationMessages,
      email,
      firstName,
      lastName,
      requiresPickupSelection,
      phone,
      phoneCountry,
      pickupPoint,
      postcode,
      shipping.country,
      shipping.needsAddress,
      shipping.selectedRateId,
    ],
  );

  const deliveryReady = deliveryValidation.ready;
  const deliveryFieldErrors = deliveryValidationAttempted
    ? deliveryValidation.fieldErrors
    : {};

  const showDeliveryFieldError = (field: DeliveryField) =>
    deliveryValidationAttempted ? deliveryFieldErrors[field] : undefined;

  const deliveryChecklist = deliveryValidation.checklist;

  useEffect(() => {
    if (!deliveryReady || checkoutAnalyticsRef.current.shipping) {
      return;
    }

    checkoutAnalyticsRef.current.shipping = true;
    trackAddShippingInfo({
      lines,
      shippingTier: shipping.selectedRate?.label ?? shipping.selectedRateId ?? "delivery",
      value: displayTotal,
    });
  }, [
    deliveryReady,
    displayTotal,
    lines,
    shipping.selectedRate,
    shipping.selectedRateId,
  ]);

  const progressStep = deriveCheckoutProgressStep({
    itemCount,
    deliveryReady,
  });

  const openCheckoutSection = useCallback((step: 1 | 2 | 3) => {
    setSectionsOpen((prev) => ({ ...prev, [step]: true }));
  }, []);

  useEffect(() => {
    if (itemCount === 0) {
      clearCheckoutDraft();
    }
  }, [itemCount]);

  useEffect(() => {
    if (itemCount === 0) {
      sectionsInitializedRef.current = false;
      setSectionsOpen({ 1: true, 2: false, 3: false });
      return;
    }

    if (!sectionsInitializedRef.current) {
      sectionsInitializedRef.current = true;
      setSectionsOpen({ 1: true, 2: true, 3: true });
    }
  }, [itemCount]);

  useEffect(() => {
    setPaymentStepReachable(itemCount > 0 && Boolean(shipping.country));
  }, [itemCount, shipping.country, setPaymentStepReachable]);

  const deliverySummary = useMemo(() => {
    const parts = [
      email.trim() || null,
      shipping.selectedRate
        ? localizeShippingRateLabel(shipping.selectedRate, locale)
        : null,
      needsPickupPoint && pickupPoint?.name ? pickupPoint.name : null,
      firstName.trim() && lastName.trim()
        ? `${firstName.trim()} ${lastName.trim()}`
        : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" · ");
    }

    return dict.checkout.deliverySectionIncomplete;
  }, [
    dict.checkout.deliverySectionIncomplete,
    email,
    firstName,
    lastName,
    locale,
    needsPickupPoint,
    pickupPoint?.name,
    shipping.selectedRate,
  ]);

  const paymentSummary = useMemo(() => {
    if (!payment.selectedId) {
      return null;
    }

    if (selectedMontonioOption) {
      return `${selectedPaymentGateway?.title ?? "Montonio"} — ${montonioOptionLabel(selectedMontonioOption, locale)}`;
    }

    return selectedPaymentGateway?.title ?? payment.selectedId;
  }, [
    locale,
    payment.selectedId,
    selectedMontonioOption,
    selectedPaymentGateway?.title,
  ]);

  const revealDeliveryIssues = useCallback(() => {
    setDeliveryValidationAttempted(true);
    openCheckoutSection(2);

    if (!deliveryValidation.ready) {
      setMobileStepError(dict.checkout.completeDeliveryFirst);
      focusDeliveryField(deliveryValidation.firstInvalidField);
      scrollToCheckoutStep(2);
      return false;
    }

    setMobileStepError(null);
    return true;
  }, [
    deliveryValidation.firstInvalidField,
    deliveryValidation.ready,
    dict.checkout.completeDeliveryFirst,
    openCheckoutSection,
  ]);

  const selectPaymentId = useCallback(
    (gatewayId: string) => {
      paymentGatewayTouchedRef.current = true;
      payment.setSelectedId(gatewayId);
    },
    [payment.setSelectedId],
  );

  const selectMontonioOption = useCallback(
    (option: MontonioPaymentOption | null) => {
      paymentGatewayTouchedRef.current = true;
      setSelectedMontonioOption(option);
    },
    [],
  );

  const persistCheckoutDraft = useCallback(() => {
    if (!shipping.country) {
      return;
    }

    writeCheckoutDraft({
      country: shipping.country,
      selectedRateId: shipping.selectedRateId,
      email,
      firstName,
      lastName,
      phone,
      phoneCountry: phoneCountry || shipping.country,
      address1,
      city,
      postcode,
      paymentId: payment.selectedId,
      montonioOptionKey: selectedMontonioOption
        ? montonioOptionKey(selectedMontonioOption)
        : null,
      pickupPoint,
      termsAccepted,
    });
  }, [
    address1,
    city,
    email,
    firstName,
    lastName,
    payment.selectedId,
    phone,
    phoneCountry,
    pickupPoint,
    postcode,
    selectedMontonioOption,
    shipping.country,
    shipping.selectedRateId,
    termsAccepted,
  ]);

  useEffect(() => {
    if (!shipping.country) {
      return;
    }

    const timer = window.setTimeout(() => {
      persistCheckoutDraft();
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [persistCheckoutDraft, shipping.country]);

  useEffect(() => {
    if (draftRestoreCompletedRef.current) {
      return;
    }

    const draft = readCheckoutDraft();
    if (!draft) {
      draftRestoreCompletedRef.current = true;
      isRestoringDraftRef.current = false;
      return;
    }

    if (shipping.loading || shipping.countriesLoading) {
      return;
    }

    if (draft.country && shipping.country !== draft.country) {
      if (!shipping.countries.includes(draft.country)) {
        draftRestoreCompletedRef.current = true;
        isRestoringDraftRef.current = false;
        return;
      }

      shipping.setCountry(draft.country);
      return;
    }

    if (!shipping.country) {
      return;
    }

    if (draft.selectedRateId && shipping.selectedRateId !== draft.selectedRateId) {
      if (shipping.syncing || shipping.rates.length === 0) {
        return;
      }

      if (shipping.rates.some((rate) => rate.id === draft.selectedRateId)) {
        shipping.setSelectedRateId(draft.selectedRateId);
      }

      return;
    }

    if (pendingPickupPointRef.current && !pickupPoint) {
      setPickupPoint(pendingPickupPointRef.current);
      pendingPickupPointRef.current = null;
    }

    if (pendingPaymentIdRef.current && !payment.selectedId) {
      if (payment.loading) {
        return;
      }

      selectPaymentId(pendingPaymentIdRef.current);
      pendingPaymentIdRef.current = null;
    }

    if (
      pendingMontonioOptionKeyRef.current &&
      !selectedMontonioOption &&
      (montonio.loading || montonio.options.length === 0)
    ) {
      return;
    }

    if (
      pendingMontonioOptionKeyRef.current &&
      !selectedMontonioOption &&
      montonio.options.length > 0
    ) {
      const match = montonio.options.find(
        (option) =>
          montonioOptionKey(option) === pendingMontonioOptionKeyRef.current,
      );

      if (match) {
        setSelectedMontonioOption(match);
        pendingMontonioOptionKeyRef.current = null;
      }
    }

    draftRestoreCompletedRef.current = true;
    isRestoringDraftRef.current = false;

    if (hasRecentCheckoutPaymentRedirect()) {
      trackCheckoutDraftRestored({
        hadPayment: Boolean(draft.paymentId),
        hadPickup: Boolean(draft.pickupPoint),
      });
      trackCheckoutPaymentReturn({ outcome: "resume" });
      setPaymentReturnBanner((current) => current ?? "resume");
    }
  }, [
    montonio.loading,
    montonio.options,
    payment.loading,
    payment.selectedId,
    pickupPoint,
    selectPaymentId,
    selectedMontonioOption,
    shipping.countries,
    shipping.countriesLoading,
    shipping.country,
    shipping.loading,
    shipping.rates,
    shipping.selectedRateId,
    shipping.setCountry,
    shipping.setSelectedRateId,
    shipping.syncing,
  ]);

  const pickupValid =
    !requiresPickupSelection ||
    Boolean(
      pickupPoint &&
        (!isLiveCheckoutEnabled() || pickupPointReadyForCheckout(pickupPoint)),
    );

  const canSubmit =
    termsAccepted &&
    deliveryReady &&
    Boolean(payment.selectedId) &&
    !paymentLoading &&
    !payment.error &&
    (!needsMontonioProvider || Boolean(selectedMontonioOption)) &&
    pickupValid;

  const submitBlockReason = resolveSubmitBlockReason({
    termsAccepted,
    deliveryReady,
    deliveryChecklist: deliveryValidation.checklist,
    paymentSelected: Boolean(payment.selectedId),
    paymentLoading,
    paymentError: payment.error,
    needsMontonioProvider,
    montonioOptionSelected: Boolean(selectedMontonioOption),
    pickupValid,
    messages: {
      terms: dict.checkout.submitBlockTerms,
      delivery: dict.checkout.submitBlockDelivery,
      payment: dict.checkout.submitBlockPayment,
      montonioBank: dict.checkout.submitBlockMontonioBank,
      pickupInvalid: dict.checkout.submitBlockPickup,
    },
  });
  const shippingError = friendlyCheckoutError(
    shipping.error,
    dict.checkout.shippingError,
    locale,
  );
  useEffect(() => {
    if (isRestoringDraftRef.current) {
      return;
    }

    setPickupPoint(null);
    setSelectedMontonioOption(null);
  }, [shipping.selectedRateId, shipping.country]);

  useEffect(() => {
    if (!shipping.country || phoneCountryTouchedRef.current) {
      return;
    }

    setPhoneCountry(shipping.country);
    setPhone((current) => stripCountryDialCode(shipping.country, current));
  }, [shipping.country]);

  useEffect(() => {
    setSelectedMontonioOption(null);
  }, [payment.selectedId]);

  useEffect(() => {
    if (
      montonio.loading ||
      !selectedPaymentGateway ||
      montonio.options.length === 0 ||
      !paymentGatewayTouchedRef.current
    ) {
      return;
    }

    const scopedOptions = filterMontonioOptionsForGateway(
      selectedPaymentGateway!,
      montonio.options,
    );

    if (
      scopedOptions.length === 1 &&
      selectedPaymentGateway &&
      isMontonioPaymentGateway(selectedPaymentGateway.id) &&
      !isBankMontonioGateway(selectedPaymentGateway)
    ) {
      setSelectedMontonioOption(scopedOptions[0]);
    }
  }, [
    montonio.configured,
    montonio.loading,
    montonio.options,
    payment.selectedGateway,
    payment.selectedId,
    selectedPaymentGateway,
  ]);

  useEffect(() => {
    if (montonio.loading || !payment.selectedId) {
      return;
    }

    if (visiblePaymentGateways.some((gateway) => gateway.id === payment.selectedId)) {
      return;
    }

    payment.setSelectedId(null);
    setSelectedMontonioOption(null);
  }, [
    montonio.loading,
    payment.selectedId,
    payment.setSelectedId,
    visiblePaymentGateways,
  ]);

  useEffect(() => {
    if (!selectedMontonioOption) {
      return;
    }

    const stillValid = montonioOptionsForGateway.some(
      (option) => montonioOptionKey(option) === montonioOptionKey(selectedMontonioOption),
    );

    if (!stillValid) {
      setSelectedMontonioOption(null);
    }
  }, [montonioOptionsForGateway, selectedMontonioOption]);

  useEffect(() => {
    const paymentError = searchParams.get("payment_error")?.trim();
    if (!paymentError) {
      return;
    }

    trackCheckoutPaymentReturn({ outcome: "error", error: paymentError });
    setPaymentReturnBanner("error");

    const targetStep = deliveryReady ? 3 : 2;
    openCheckoutSection(targetStep);
    scrollToCheckoutStep(targetStep);
    setSubmitError(
      paymentError === "Payment cancelled" || paymentError === "Payment failed"
        ? t.paymentReturnError
        : paymentError,
    );

    const params = new URLSearchParams(searchParams.toString());
    params.delete("payment_error");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [deliveryReady, openCheckoutSection, pathname, router, searchParams, t.paymentReturnError]);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam === "2") {
      openCheckoutSection(2);
      scrollToCheckoutStep(2);
    } else if (stepParam === "3") {
      openCheckoutSection(3);
      scrollToCheckoutStep(3);
    }
  }, [openCheckoutSection, searchParams]);

  useEffect(() => {
    registerCheckoutStepNavigator((step) => {
      openCheckoutSection(step);
      scrollToCheckoutStep(step);
    });

    return () => {
      registerCheckoutStepNavigator(null);
    };
  }, [openCheckoutSection, registerCheckoutStepNavigator]);

  useEffect(() => {
    if (itemCount === 0 || orderId) {
      setCheckoutStep(null);
      return;
    }

    setCheckoutStep(progressStep);
  }, [progressStep, itemCount, orderId, setCheckoutStep]);

  useEffect(() => {
    return () => {
      setCheckoutStep(null);
    };
  }, [setCheckoutStep]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!revealDeliveryIssues() || !canSubmit) {
      if (!canSubmit && submitBlockReason) {
        trackCheckoutSubmitBlocked(submitBlockReason);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!isLiveCheckoutEnabled()) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        setPreviewPaymentTitle(
          selectedMontonioOption
            ? `${selectedPaymentGateway?.title ?? "Montonio"} — ${montonioOptionLabel(selectedMontonioOption, locale)}`
            : selectedPaymentGateway?.title ?? payment.selectedId ?? "—",
        );
        return;
      }

      if (
        needsPickupPoint &&
        isLiveCheckoutEnabled() &&
        !pickupPointReadyForCheckout(pickupPoint)
      ) {
        throw new Error(
          locale === "et"
            ? "Pakiautomaadi valik ei ole Montonio jaoks kehtiv. Värskenda lehte ja vali automaat uuesti."
            : "The selected parcel locker is not valid for Montonio checkout. Refresh the page and choose again.",
        );
      }

      const fallbackLocation = defaultLocationForCountry(shipping.country);
      const checkoutCustomer = {
        email,
        firstName,
        lastName,
        phone: formatPhoneWithCountryCode(phoneCountry, phone),
        country: shipping.country,
        postcode: shipping.needsAddress
          ? postcode
          : pickupPoint?.postcode || fallbackLocation.postcode,
        city: shipping.needsAddress
          ? city
          : pickupPoint?.city || fallbackLocation.city,
        address1: shipping.needsAddress
          ? address1
          : pickupPoint?.name || fallbackLocation.city,
      };
      const { billing, shipping: shippingAddress } =
        buildCheckoutInputAddresses(checkoutCustomer);
      const pickupNote = [
        pickupPoint
          ? `Pakiautomaat: ${pickupPoint.name} (${pickupPoint.address}, ${pickupPoint.city}) [${pickupPoint.carrier}:${pickupPoint.id}]`
          : null,
        isMontonioPaymentGateway(payment.selectedId) && selectedMontonioOption
          ? `Montonio: ${selectedMontonioOption.systemName} / ${selectedMontonioOption.code}`
          : null,
      ]
        .filter(Boolean)
        .join("\n") || undefined;

      const { sessionToken: activeSession } = await updateCheckoutCustomerShipping(
        checkoutCustomer,
        readWooSessionToken(),
      );

      const checkoutMetaData = buildMontonioCheckoutMetaData({
        pickupPoint,
        montonioOption: selectedMontonioOption,
        country: shipping.country,
        paymentGatewayId: payment.selectedId,
        locale,
      });

      const result = await submitCheckout(
        {
          paymentMethod: payment.selectedId ?? undefined,
          billing,
          shipping: shippingAddress,
          ...(pickupNote ? { customerNote: pickupNote } : {}),
          ...(checkoutMetaData.length ? { metaData: checkoutMetaData } : {}),
        },
        activeSession,
      );

      let redirectUrl = result.redirect;

      if (
        shouldRunMontonioPaymentRemint(payment.selectedId, selectedMontonioOption) &&
        result.orderDatabaseId
      ) {
        const paymentLineItems = [
          ...lines.map((line) => ({
            name: line.size ? `${line.name} (${line.size})` : line.name,
            finalPrice: line.price * line.quantity,
            quantity: line.quantity,
          })),
          ...(displayShipping > 0
            ? [{ name: "SHIPPING", finalPrice: displayShipping, quantity: 1 }]
            : []),
        ];

        const remintResponse = await fetch("/api/checkout/montonio-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderDatabaseId: result.orderDatabaseId,
            orderNumber: result.orderNumber,
            total: displayTotal,
            currency: "EUR",
            locale,
            country: shipping.country,
            montonioOption: selectedMontonioOption,
            billing: {
              firstName,
              lastName,
              email,
              phone: formatPhoneWithCountryCode(phoneCountry, phone),
              address1: billing.address1,
              city: billing.city,
              postcode: billing.postcode,
              country: billing.country,
            },
            shipping: {
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              email,
              phone: formatPhoneWithCountryCode(phoneCountry, phone),
              address1: shippingAddress.address1,
              city: shippingAddress.city,
              postcode: shippingAddress.postcode,
              country: shippingAddress.country,
            },
            lineItems: paymentLineItems,
          }),
        });

        const remintBody = (await remintResponse.json()) as {
          redirect?: string;
          error?: string;
        };

        if (!remintResponse.ok || !remintBody.redirect) {
          throw new Error(
            remintBody.error ??
              (locale === "et"
                ? "Makse käivitamine ebaõnnestus. Proovi uuesti."
                : "Could not start payment. Please try again."),
          );
        }

        redirectUrl = remintBody.redirect;
      }

      if (redirectUrl) {
        // Keep the local cart intact for the external payment page — if the
        // buyer cancels, they return to a working checkout. The thank-you
        // page clears the cart after a successful payment. The Woo session
        // must be dropped though: checkout consumed the backend cart, so a
        // returning buyer needs a fresh session + resync to see shipping
        // rates again.
        resetCheckoutSyncState();
        persistCheckoutDraft();
        markCheckoutPaymentRedirect();
        trackCheckoutPaymentReturn({ outcome: "redirect" });
        window.location.assign(redirectUrl);
        return;
      }

      setOrderId(result.orderNumber ?? `MR-${Date.now().toString(36).toUpperCase()}`);
      clearCheckoutDraft();
      clearCheckoutPaymentRedirect();
      setPaymentReturnBanner(null);
      clearCart();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? friendlyCheckoutError(
              cause.message,
              dict.checkout.paymentError,
              locale,
            ) ??
            cause.message
          : dict.checkout.paymentError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (previewPaymentTitle) {
    return (
      <div className="site-container py-16 text-center lg:py-24">
        <p className="section-eyebrow text-accent">{t.testPaymentDone}</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase sm:text-4xl">
          {t.testPaymentDone}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-ink/70">
          {t.testPaymentBody.replace("{method}", previewPaymentTitle)}
        </p>
        <button
          type="button"
          onClick={() => setPreviewPaymentTitle(null)}
          className="btn-accent mt-10 inline-flex"
        >
          {t.backToCheckout}
        </button>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="site-container py-16 text-center lg:py-24">
        <p className="section-eyebrow text-accent">{t.orderConfirmed}</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase sm:text-4xl">
          {t.thankYou}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-ink/70">
          {t.orderOnItsWay
            .replace("{order}", orderId)
            .replace(
              "{delivery}",
              shipping.selectedRate
                ? localizeShippingRateLabel(shipping.selectedRate, locale)
                : t.deliveryChosen,
            )
            .replace("{confirmation}", t.confirmationSent)
            .replace("{email}", email)}
        </p>
        {!isLiveCheckoutEnabled() ? (
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink/55">
            {t.demoNotice}
          </p>
        ) : null}
        <Link href={localizedHref(locale, "/")} className="btn-accent mt-10 inline-flex">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="site-container py-16 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-sm border border-ink/10 bg-surface/50 p-7 sm:p-8">
          <p className="text-lg font-semibold text-ink">
            {t.emptyCart}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={localizedHref(locale, buildEquipmentHubHref(locale))} className="btn-accent">
              {t.backToShop}
            </Link>
            <Link href={localizedHref(locale, "/shop/motorcycles")} className="btn-ghost">
              {t.browseMotorcycles}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summaryProps = {
    itemCount,
    subtotal: displaySubtotal,
    discountTotal: displayDiscount,
    shippingTotal: displayShipping,
    total: displayTotal,
    selectedRate: shipping.selectedRate,
    country: shipping.country,
    pickupPointName: needsPickupPoint ? pickupPoint?.name ?? null : null,
    termsAccepted,
    onTermsChange: setTermsAccepted,
    canSubmit,
    submitting,
    loading: shipping.loading || paymentLoading,
    formId: FORM_ID,
    payLabel: isLiveCheckoutEnabled() ? undefined : t.testPayment,
    submitBlockReason,
  };

  return (
    <div className="site-container pb-8 pt-4 lg:pb-14 lg:pt-10">
      <header className="mb-3 max-w-2xl lg:mb-6">
        <h1 className="text-3xl font-extrabold uppercase sm:text-4xl">
          {dict.checkout.cart}
        </h1>
        <p className="mt-2 hidden text-sm text-ink/60 lg:block">
          {itemCount} {itemCount === 1 ? t.item : t.items} ·{" "}
          <span className="font-body font-extrabold tabular-nums text-ink">
            {formatCheckoutPrice(displayTotal, locale)}
          </span>{" "}
          {t.total}
        </p>
      </header>

      {paymentReturnBanner ? (
        <CheckoutPaymentReturnBanner
          variant={paymentReturnBanner}
          onDismiss={() => {
            setPaymentReturnBanner(null);
            clearCheckoutPaymentRedirect();
          }}
        />
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0 space-y-3 lg:space-y-0">
          <CheckoutMobileSection
            id="checkout-step-cart"
            step={1}
            title={dict.checkout.yourCart}
            complete={itemCount > 0}
            open
            mobileHeaderless
            collapsible={false}
          >
            <CheckoutCartTable
              lines={lines}
              onDecrease={(line) =>
                updateQuantity(line.slug, line.quantity - 1, line.size)
              }
              onIncrease={(line) =>
                updateQuantity(line.slug, line.quantity + 1, line.size)
              }
              onRemove={(line) => removeItem(line.slug, line.size)}
              locale={locale}
              labels={{
                remove: t.remove,
                image: t.image,
                product: t.product,
                quantity: t.quantity,
                sum: t.sum,
                decrease: dict.checkout.decreaseQty,
                increase: dict.checkout.increaseQty,
              }}
            />
            <details className="mt-6 border-t border-ink/10 pt-5">
              <summary className="cursor-pointer text-sm font-medium text-ink/55 hover:text-ink">
                {dict.checkout.haveDiscountCode}
              </summary>
              <div className="mt-3 space-y-3">
                {shipping.appliedCoupons.length > 0 ? (
                  <ul className="space-y-2">
                    {shipping.appliedCoupons.map((coupon) => (
                      <li
                        key={coupon.code}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-ink/10 bg-paper px-3 py-2 text-sm"
                      >
                        <span className="font-medium uppercase tracking-wide text-ink">
                          {coupon.code}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-body font-extrabold tabular-nums text-accent">
                            −{formatCheckoutPrice(coupon.discountAmount, locale)}
                          </span>
                          <button
                            type="button"
                            onClick={() => void shipping.removeCoupon(coupon.code)}
                            disabled={shipping.couponLoading || shipping.loading || shipping.syncing}
                            className="text-xs font-medium text-ink/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {dict.checkout.removeCoupon}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <form
                  className="flex items-stretch gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleApplyCoupon();
                  }}
                >
                  <label className="sr-only" htmlFor="coupon_code">
                    {dict.checkout.discountCode}
                  </label>
                  <input
                    id="coupon_code"
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder={dict.checkout.discountCode}
                    autoComplete="off"
                    disabled={shipping.couponLoading || shipping.loading || shipping.syncing}
                    className="min-w-0 flex-1 border border-ink/15 bg-white px-3 py-3 text-base uppercase focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={
                      shipping.couponLoading ||
                      shipping.loading ||
                      shipping.syncing ||
                      !couponCode.trim()
                    }
                    className="inline-flex shrink-0 items-center justify-center bg-ink/20 px-5 py-3 text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:bg-ink/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {shipping.couponLoading
                      ? dict.checkout.validatingCoupon
                      : dict.checkout.validateCoupon}
                  </button>
                </form>
                {shipping.couponError ? (
                  <p className="text-sm text-accent" role="alert">
                    {shipping.couponError}
                  </p>
                ) : null}
              </div>
            </details>
          </CheckoutMobileSection>

          <div className="overflow-hidden rounded-lg bg-white p-4 shadow-[0_4px_20px_rgb(11_11_11_/_0.06)] lg:hidden">
            <CampaignCartPanels
              placement="cart-page"
              variant="compact"
              flat
            />
          </div>

          <form
            id={FORM_ID}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-3 lg:space-y-0"
          >
            <CheckoutMobileSection
              id="checkout-step-delivery"
              step={2}
              title={dict.checkout.deliveryContact}
              complete={deliveryReady}
              open={sectionsOpen[2]}
              onOpenChange={(open) =>
                setSectionsOpen((prev) => ({ ...prev, 2: open }))
              }
              summary={deliverySummary}
            >
              <div className="space-y-6">
                <label className="block">
                  <DeliveryFieldLabel
                    complete={isDeliveryChecklistComplete(deliveryChecklist, "country")}
                  >
                    {t.country}
                  </DeliveryFieldLabel>
                  <select
                    name="country"
                    required
                    value={shipping.country}
                    disabled={
                      shipping.countriesLoading &&
                      shipping.countries.length === 0
                    }
                    onChange={(event) => shipping.setCountry(event.target.value)}
                    className={inputWithErrorClass(Boolean(showDeliveryFieldError("country")))}
                    aria-invalid={Boolean(showDeliveryFieldError("country"))}
                  >
                    <option value="" disabled>
                      {shipping.countriesLoading &&
                      shipping.countries.length === 0
                        ? t.loadingCountries
                        : t.chooseCountry}
                    </option>
                    {shipping.countries.map((code) => (
                      <option key={code} value={code}>
                        {countryLabel(code)}
                      </option>
                    ))}
                  </select>
                  {showDeliveryFieldError("country") ? (
                    <p className="mt-2 text-sm text-accent" role="alert">
                      {showDeliveryFieldError("country")}
                    </p>
                  ) : null}
                  {!shipping.country && shipping.suggestedCountry ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-ink/10 bg-ink/[0.03] px-3 py-2">
                      <p className="text-sm text-ink/70">
                        {dict.checkout.suggestedCountryHint.replace(
                          "{country}",
                          countryLabel(shipping.suggestedCountry),
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => shipping.setCountry(shipping.suggestedCountry!)}
                        className="border border-ink/20 px-3 py-1.5 font-body text-[11px] font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {dict.checkout.useSuggestedCountry.replace(
                          "{country}",
                          countryLabel(shipping.suggestedCountry),
                        )}
                      </button>
                    </div>
                  ) : null}
                  {shippingError ? (
                    <p className="mt-2 text-sm text-accent">{shippingError}</p>
                  ) : null}
                  {!shipping.countriesLoading &&
                  shipping.countries.length === 0 &&
                  itemCount > 0 ? (
                    <div className="mt-3">
                      <CheckoutSupportNotice locale={locale} />
                    </div>
                  ) : null}
                </label>

                <div>
                  <DeliveryFieldLabel
                    complete={isDeliveryChecklistComplete(deliveryChecklist, "shipping")}
                  >
                    {t.deliveryMethod}
                  </DeliveryFieldLabel>
                  <div className="mt-2">
                    {shipping.statusMessage &&
                    (shipping.loading || shipping.syncing) &&
                    shipping.rates.length === 0 &&
                    !shippingError ? (
                      <p className="mb-2 text-sm text-ink/70">{shipping.statusMessage}</p>
                    ) : null}
                    {(shipping.loading || shipping.syncing) &&
                    shipping.rates.length === 0 &&
                    !shippingError ? (
                      <CheckoutShippingOptionsSkeleton />
                    ) : shippingError ? (
                      <div className="space-y-3">
                        <p className="text-sm text-accent">{shippingError}</p>
                        <button
                          type="button"
                          onClick={shipping.retryBootstrap}
                          className="border border-ink/20 px-4 py-2 font-body text-[11px] font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent"
                        >
                          {dict.error.retry}
                        </button>
                        <CheckoutSupportNotice locale={locale} />
                      </div>
                    ) : !shipping.country &&
                      !shipping.loading &&
                      !shipping.syncing ? (
                      <p className="text-sm text-ink/60">
                        {t.chooseCountryForDelivery}
                      </p>
                    ) : shipping.rates.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-ink/60">{t.noDeliveryOptions}</p>
                        <button
                          type="button"
                          onClick={shipping.retryBootstrap}
                          className="border border-ink/20 px-4 py-2 font-body text-[11px] font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent"
                        >
                          {dict.error.retry}
                        </button>
                        <CheckoutSupportNotice locale={locale} />
                      </div>
                    ) : (
                      <CheckoutShippingOptions
                        rates={shipping.rates}
                        selectedRateId={shipping.selectedRateId}
                        onSelect={shipping.setSelectedRateId}
                        syncing={shipping.syncing}
                      />
                    )}
                  </div>
                  {showDeliveryFieldError("shipping") ? (
                    <p className="mt-2 text-sm text-accent" role="alert">
                      {showDeliveryFieldError("shipping")}
                    </p>
                  ) : null}
                  {!shipping.needsAddress &&
                  shipping.selectedRate &&
                  pickupPointSources ? (
                    <CheckoutPickupPointSelector
                      shippingRate={shipping.selectedRate}
                      country={shipping.country}
                      selectedPoint={pickupPoint}
                      onSelect={setPickupPoint}
                      complete={isDeliveryChecklistComplete(
                        deliveryChecklist,
                        "pickupPoint",
                      )}
                    />
                  ) : null}
                  {showDeliveryFieldError("pickupPoint") ? (
                    <p className="mt-2 text-sm text-accent" role="alert">
                      {showDeliveryFieldError("pickupPoint")}
                    </p>
                  ) : null}
                </div>

                {shipping.needsAddress ? (
                  <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <DeliveryFieldLabel
                        complete={isDeliveryChecklistComplete(deliveryChecklist, "address")}
                      >
                        {t.streetAddress}
                      </DeliveryFieldLabel>
                      <input
                        type="text"
                        name="address-line1"
                        required
                        autoComplete="address-line1"
                        value={address1}
                        onChange={(event) => setAddress1(event.target.value)}
                        onBlur={shipping.commitDeliveryAddress}
                        className={inputWithErrorClass(Boolean(showDeliveryFieldError("address")))}
                        aria-invalid={Boolean(showDeliveryFieldError("address"))}
                      />
                      {showDeliveryFieldError("address") ? (
                        <p className="mt-2 text-sm text-accent" role="alert">
                          {showDeliveryFieldError("address")}
                        </p>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClassName}>{t.city}</span>
                      <input
                        type="text"
                        name="address-level2"
                        required
                        autoComplete="address-level2"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        onBlur={shipping.commitDeliveryAddress}
                        className={inputWithErrorClass(Boolean(showDeliveryFieldError("city")))}
                        aria-invalid={Boolean(showDeliveryFieldError("city"))}
                      />
                      {showDeliveryFieldError("city") ? (
                        <p className="mt-2 text-sm text-accent" role="alert">
                          {showDeliveryFieldError("city")}
                        </p>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClassName}>{t.postcode}</span>
                      <input
                        type="text"
                        name="postal-code"
                        required
                        autoComplete="postal-code"
                        value={postcode}
                        onChange={(event) => setPostcode(event.target.value)}
                        onBlur={shipping.commitDeliveryAddress}
                        className={inputWithErrorClass(Boolean(showDeliveryFieldError("postcode")))}
                        aria-invalid={Boolean(showDeliveryFieldError("postcode"))}
                      />
                      {showDeliveryFieldError("postcode") ? (
                        <p className="mt-2 text-sm text-accent" role="alert">
                          {showDeliveryFieldError("postcode")}
                        </p>
                      ) : null}
                    </label>
                  </div>
                ) : null}

                <div className="grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2 sm:gap-4">
                  <label className="block">
                    <DeliveryFieldLabel
                      complete={isDeliveryChecklistComplete(deliveryChecklist, "name")}
                    >
                      {t.firstName}
                    </DeliveryFieldLabel>
                    <input
                      type="text"
                      name="given-name"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className={inputWithErrorClass(Boolean(showDeliveryFieldError("firstName")))}
                      aria-invalid={Boolean(showDeliveryFieldError("firstName"))}
                    />
                    {showDeliveryFieldError("firstName") ? (
                      <p className="mt-2 text-sm text-accent" role="alert">
                        {showDeliveryFieldError("firstName")}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <DeliveryFieldLabel
                      complete={isDeliveryChecklistComplete(deliveryChecklist, "name")}
                    >
                      {t.lastName}
                    </DeliveryFieldLabel>
                    <input
                      type="text"
                      name="family-name"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className={inputWithErrorClass(Boolean(showDeliveryFieldError("lastName")))}
                      aria-invalid={Boolean(showDeliveryFieldError("lastName"))}
                    />
                    {showDeliveryFieldError("lastName") ? (
                      <p className="mt-2 text-sm text-accent" role="alert">
                        {showDeliveryFieldError("lastName")}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <DeliveryFieldLabel
                      complete={isDeliveryChecklistComplete(deliveryChecklist, "email")}
                    >
                      {t.email}
                    </DeliveryFieldLabel>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputWithErrorClass(Boolean(showDeliveryFieldError("email")))}
                      aria-invalid={Boolean(showDeliveryFieldError("email"))}
                    />
                    {showDeliveryFieldError("email") ? (
                      <p className="mt-2 text-sm text-accent" role="alert">
                        {showDeliveryFieldError("email")}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <DeliveryFieldLabel
                      complete={isDeliveryChecklistComplete(deliveryChecklist, "phone")}
                    >
                      {t.phone}
                    </DeliveryFieldLabel>
                    <CheckoutPhoneField
                      country={phoneCountry}
                      onCountryChange={(code) => {
                        phoneCountryTouchedRef.current = true;
                        setPhoneCountry(code);
                        setPhone((current) => stripCountryDialCode(code, current));
                      }}
                      value={phone}
                      onChange={setPhone}
                      required
                      inputClassName={inputWithErrorClass(Boolean(showDeliveryFieldError("phone")))}
                    />
                    {showDeliveryFieldError("phone") ? (
                      <p className="mt-2 text-sm text-accent" role="alert">
                        {showDeliveryFieldError("phone")}
                      </p>
                    ) : null}
                  </label>
                </div>

                {mobileStepError ? (
                  <p className="text-sm text-accent" role="alert">
                    {mobileStepError}
                  </p>
                ) : null}

                <CheckoutMobileDeliveryTotals
                  shippingTotal={displayShipping}
                  total={displayTotal}
                  selectedRate={shipping.selectedRate}
                  shippingLoading={shipping.loading || shipping.syncing}
                  className="mt-2"
                />
              </div>
            </CheckoutMobileSection>

            <CheckoutMobileSection
              id="checkout-step-payment"
              step={3}
              title={dict.checkout.pay}
              complete={canSubmit}
              open={sectionsOpen[3]}
              onOpenChange={(open) =>
                setSectionsOpen((prev) => ({ ...prev, 3: open }))
              }
              summary={paymentSummary}
              collapsible
            >
              <div className="space-y-6">
                <div className="border-t border-ink/10 pt-5 lg:border-0 lg:pt-0">
                  <p className={labelClassName}>{t.paymentMethod}</p>
                  <div className="mt-2">
                    {!shipping.country ? (
                      <p className="text-sm text-ink/60">
                        {dict.checkout.chooseCountryForPayment}
                      </p>
                    ) : (
                      <CheckoutPaymentOptions
                        gateways={visiblePaymentGateways}
                        selectedId={payment.selectedId}
                        onSelect={selectPaymentId}
                        montonioOptions={montonio.options}
                        montonioLoading={montonio.loading}
                        montonioError={montonio.error}
                        montonioConfigured={montonio.configured}
                        selectedMontonioKey={
                          selectedMontonioOption
                            ? montonioOptionKey(selectedMontonioOption)
                            : null
                        }
                        onSelectMontonioOption={selectMontonioOption}
                        loading={paymentLoading}
                        error={payment.error}
                        locale={locale}
                      />
                    )}
                  </div>
                </div>

                {submitError ? (
                  <p className="text-sm text-accent" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <div className="border-t border-ink/10 pt-5 lg:hidden">
                  <CheckoutOrderSummary {...summaryProps} variant="mobile" />
                </div>
              </div>
            </CheckoutMobileSection>
          </form>
        </div>

        <CheckoutSummaryShell className="hidden lg:block">
          <div className="mb-4 bg-white p-5 shadow-[0_12px_40px_rgb(11_11_11_/_0.07)] sm:p-6">
            <CampaignCartPanels
              placement="checkout"
              variant="compact"
              flat
              ctaVariant="link"
            />
          </div>
          <CheckoutOrderSummary {...summaryProps} />
        </CheckoutSummaryShell>
      </div>
    </div>
  );
}
