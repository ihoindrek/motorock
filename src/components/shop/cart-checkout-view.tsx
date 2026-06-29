"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCart, type CartLine } from "@/context/cart-context";
import { useCheckoutStep } from "@/context/checkout-step-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import {
  countryLabel,
  useCheckoutShipping,
} from "@/hooks/use-checkout-shipping";
import { useCheckoutPayment } from "@/hooks/use-checkout-payment";
import { useMontonioPaymentOptions } from "@/hooks/use-montonio-payment-options";
import { isLiveCheckoutEnabled } from "@/lib/checkout-mode";
import {
  submitCheckout,
  updateCheckoutCustomerShipping,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  CheckoutMobilePayBar,
  CheckoutOrderSummary,
  CheckoutSummaryShell,
} from "@/components/shop/checkout-order-summary";
import {
  CheckoutShippingOptions,
  CheckoutShippingOptionsSkeleton,
} from "@/components/shop/checkout-shipping-options";
import { cartLineThumbnailClass } from "@/lib/shop/cart-line-image";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { Price } from "@/components/shop/price";
import { cartHasEquipment } from "@/lib/shop/cart-has-equipment";
import { defaultLocationForCountry } from "@/lib/shop/countries";
import {
  formatPhoneWithCountryCode,
  isValidCheckoutPhone,
  stripCountryDialCode,
} from "@/lib/shop/phone";
import { cn } from "@/lib/utils";
import { EquipmentReturnPromise } from "@/components/shop/equipment-return-promise";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";
import { ShowroomPickupPanel } from "@/components/shop/showroom-pickup-panel";
import { CheckoutPickupPointSelector } from "@/components/shop/checkout-pickup-point-selector";
import { CheckoutPhoneField } from "@/components/shop/checkout-phone-field";
import { CheckoutPaymentOptions, filterMontonioOptionsForGateway } from "@/components/shop/checkout-payment-options";
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

const labelClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50";

function friendlyCheckoutError(message: string | null, fallback: string) {
  if (!message) {
    return null;
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

function CheckoutBlock({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-t border-ink/10 py-8 first:border-t-0 first:pt-0 lg:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-body text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
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

function CartLineMeta({ line, locale }: { line: CartLine; locale: "en" | "et" }) {
  const labels =
    locale === "et"
      ? { size: "Suurus", color: "Värv" }
      : { size: "Size", color: "Colour" };
  const parts = [
    line.size ? `${labels.size}: ${line.size}` : null,
    line.color ? `${labels.color}: ${line.color}` : null,
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
      <div className="space-y-3 md:hidden">
        {lines.map((line) => {
          if (!line.name || !line.image) {
            return null;
          }

          const lineTotal = line.price * line.quantity;
          const thumbnail = cartLineThumbnailClass(line);

          return (
            <article
              key={`${line.slug}:${line.size ?? ""}`}
              className="flex gap-3 border border-ink/10 bg-surface/50 p-3"
            >
              <Link
                href={`/shop/product/${line.slug}`}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/10",
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
                      href={`/shop/product/${line.slug}`}
                      className="mt-0.5 block text-sm font-semibold leading-snug text-ink hover:text-accent"
                    >
                      {line.name}
                    </Link>
                    <CartLineMeta line={line} locale={locale} />
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
                  href={`/shop/product/${line.slug}`}
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
                    href={`/shop/product/${line.slug}`}
                    className="mt-1 block text-base font-semibold leading-snug text-ink hover:text-accent"
                  >
                    {line.name}
                  </Link>
                  <CartLineMeta line={line} locale={locale} />
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
  const t =
    locale === "et"
      ? {
          orderConfirmed: "Tellimus kinnitatud",
          thankYou: "Aitäh",
          deliveryChosen: "sinu valitud tarnega",
          confirmationSent: "Saatsime kinnituse aadressile",
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
          continueShopping: "Jätka ostlemist",
          haveDiscountCode: "Kas sul on sooduskood?",
          apply: "Rakenda",
          email: "E-post",
          country: "Riik",
          deliveryMethod: "Tarneviis",
          noDeliveryOptions: "Tarneviisid puuduvad — tühjenda ostukorv ja lisa toode uuesti tootelehelt (vali suurus).",
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
          securePayment:
            "Turvaline makse Montonioga — pank, kaart, maksa hiljem ja järelmaks",
          paymentMethod: "Makseviis",
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
          continueShopping: "Continue shopping",
          haveDiscountCode: "Have a discount code?",
          apply: "Apply",
          email: "Email",
          country: "Country",
          deliveryMethod: "Delivery method",
          noDeliveryOptions:
            "No delivery options — clear your cart and re-add from the product page (choose a size).",
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
          securePayment:
            "Secure payment via Montonio — bank, card, pay later & järelmaks",
          paymentMethod: "Payment method",
          testPayment: "Test payment",
          testPaymentDone: "Payment test complete",
          testPaymentBody:
            'You selected "{method}". No WooCommerce order was created and no payment was taken.',
          backToCheckout: "Back to checkout",
        };
  const { lines, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("EE");
  const phoneCountryTouchedRef = useRef(false);
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [previewPaymentTitle, setPreviewPaymentTitle] = useState<string | null>(
    null,
  );
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  const [selectedMontonioOption, setSelectedMontonioOption] =
    useState<MontonioPaymentOption | null>(null);

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

  const shipping = useCheckoutShipping(lines, customer);
  const paymentReady =
    !shipping.loading && shipping.rates.length > 0 && !shipping.syncing;
  const paymentRefreshKey = `${shipping.country}:${shipping.selectedRateId ?? ""}:${shipping.rates.map((rate) => rate.id).join("|")}`;
  const payment = useCheckoutPayment(paymentReady, paymentRefreshKey);
  const paymentWaiting =
    !shipping.loading && !shipping.syncing && shipping.rates.length === 0;
  const montonioSelected = Boolean(
    payment.selectedGateway?.id?.toLowerCase().includes("montonio"),
  );
  const montonio = useMontonioPaymentOptions(
    shipping.country,
    montonioSelected && paymentReady,
  );
  const montonioOptionsForGateway = useMemo(() => {
    if (!payment.selectedGateway) {
      return [];
    }

    return filterMontonioOptionsForGateway(
      payment.selectedGateway,
      montonio.options,
    );
  }, [montonio.options, payment.selectedGateway]);
  const paymentLoading =
    paymentReady &&
    (payment.loading || (montonioSelected && montonio.loading));
  const needsMontonioProvider =
    montonioSelected &&
    montonio.configured &&
    !montonio.loading &&
    montonioOptionsForGateway.length > 0;
  const { setCheckoutStep } = useCheckoutStep();

  const needsPickupPoint = shippingMethodNeedsPickupPoint(shipping.selectedRate);
  const pickupPointSources = useMemo(() => {
    if (!shipping.selectedRate || !needsPickupPoint) {
      return null;
    }

    return resolvePickupPointSources(shipping.selectedRate, shipping.country);
  }, [needsPickupPoint, shipping.country, shipping.selectedRate]);

  const displaySubtotal = shipping.wcSubtotal ?? subtotal;
  const displayShipping = shipping.shippingTotal;
  const displayTotal = shipping.wcTotal ?? displaySubtotal + displayShipping;

  const deliveryReady =
    Boolean(email) &&
    Boolean(firstName) &&
    Boolean(lastName) &&
    isValidCheckoutPhone(phoneCountry, phone) &&
    Boolean(shipping.selectedRateId) &&
    (!shipping.needsAddress || Boolean(address1 && city && postcode)) &&
    (!needsPickupPoint || Boolean(pickupPoint));

  const checkoutStep = useMemo((): 1 | 2 | 3 => {
    if (deliveryReady) {
      return 3;
    }

    if (email || shipping.selectedRateId || firstName || lastName) {
      return 2;
    }

    return 1;
  }, [
    deliveryReady,
    email,
    shipping.selectedRateId,
    firstName,
    lastName,
  ]);

  const canSubmit =
    termsAccepted &&
    deliveryReady &&
    Boolean(payment.selectedId) &&
    !paymentLoading &&
    !payment.error &&
    (!needsMontonioProvider || Boolean(selectedMontonioOption));
  const shippingError = friendlyCheckoutError(
    shipping.error,
    dict.checkout.shippingError,
  );

  useEffect(() => {
    setPickupPoint(null);
    setSelectedMontonioOption(null);
  }, [shipping.selectedRateId, shipping.country]);

  useEffect(() => {
    if (!phoneCountryTouchedRef.current) {
      setPhoneCountry(shipping.country);
      setPhone((current) => stripCountryDialCode(shipping.country, current));
    }
  }, [shipping.country]);

  useEffect(() => {
    setSelectedMontonioOption(null);
  }, [payment.selectedId]);

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
    if (itemCount === 0 || orderId) {
      setCheckoutStep(null);
      return;
    }

    setCheckoutStep(checkoutStep);

    return () => {
      setCheckoutStep(null);
    };
  }, [checkoutStep, itemCount, orderId, setCheckoutStep]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!isLiveCheckoutEnabled()) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        setPreviewPaymentTitle(
          selectedMontonioOption
            ? `${payment.selectedGateway?.title ?? "Montonio"} — ${montonioOptionLabel(selectedMontonioOption, locale)}`
            : payment.selectedGateway?.title ?? payment.selectedId ?? "—",
        );
        return;
      }

      const sessionToken = readWooSessionToken();
      const fallbackLocation = defaultLocationForCountry(shipping.country);
      const pickupNote = [
        pickupPoint
          ? `Pakiautomaat: ${pickupPoint.name} (${pickupPoint.address}, ${pickupPoint.city}) [${pickupPoint.carrier}:${pickupPoint.id}]`
          : null,
        selectedMontonioOption
          ? `Montonio: ${selectedMontonioOption.systemName} / ${selectedMontonioOption.code}`
          : null,
      ]
        .filter(Boolean)
        .join("\n") || undefined;

      await updateCheckoutCustomerShipping(
        {
          country: shipping.country,
          email,
          firstName,
          lastName,
          phone: formatPhoneWithCountryCode(phoneCountry, phone),
          postcode: shipping.needsAddress
            ? postcode
            : pickupPoint?.postcode || fallbackLocation.postcode,
          city: shipping.needsAddress
            ? city
            : pickupPoint?.city || fallbackLocation.city,
          address1: shipping.needsAddress
            ? address1
            : pickupPoint?.name,
        },
        sessionToken,
      );

      const result = await submitCheckout(
        {
          paymentMethod: payment.selectedId ?? undefined,
          ...(pickupNote ? { customerNote: pickupNote } : {}),
        },
        readWooSessionToken(),
      );

      if (result.redirect) {
        clearCart();
        window.location.assign(result.redirect);
        return;
      }

      setOrderId(result.orderNumber ?? `MR-${Date.now().toString(36).toUpperCase()}`);
      clearCart();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? friendlyCheckoutError(cause.message, dict.checkout.paymentError) ??
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
          Order <span className="font-bold text-ink">{orderId}</span> is on its
          way via {shipping.selectedRate?.label ?? t.deliveryChosen}.{" "}
          {t.confirmationSent} {email}.
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
            <Link href={localizedHref(locale, "/shop/equipment")} className="btn-accent">
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
    shippingTotal: displayShipping,
    total: displayTotal,
    selectedRate: shipping.selectedRate,
    country: shipping.country,
    termsAccepted,
    onTermsChange: setTermsAccepted,
    canSubmit,
    submitting,
    loading: shipping.loading || paymentLoading,
    formId: FORM_ID,
    payLabel: isLiveCheckoutEnabled() ? undefined : t.testPayment,
  };

  return (
    <div className="site-container pb-28 pt-8 lg:pb-14 lg:pt-10">
      <header className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-extrabold uppercase sm:text-4xl">
          {t.checkout}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {itemCount} {itemCount === 1 ? t.item : t.items} ·{" "}
          <span className="font-body font-extrabold tabular-nums text-ink">
            {formatCheckoutPrice(displayTotal, locale)}
          </span>{" "}
          {t.total}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <CheckoutBlock
            title={dict.checkout.yourCart}
            action={
              <Link
                href={localizedHref(locale, "/shop/equipment")}
                className="text-xs font-medium text-ink/45 hover:text-accent"
              >
                {t.continueShopping}
              </Link>
            }
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
                {t.haveDiscountCode}
              </summary>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor="coupon_code">
                  {dict.checkout.discountCode}
                </label>
                <input
                  id="coupon_code"
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder={dict.checkout.discountCode}
                  className="w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none sm:max-w-xs"
                />
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center border border-ink/20 px-5 text-xs font-bold uppercase tracking-aggressive text-ink/70"
                >
                  {t.apply}
                </button>
              </div>
            </details>
            {cartHasEquipment(lines) ? (
              <div className="mt-6">
                <EquipmentReturnPromise variant="banner" />
              </div>
            ) : null}
            <CampaignCartPanels
              placement="cart-page"
              variant="compact"
              className="mt-6 lg:hidden"
            />
          </CheckoutBlock>

          <form id={FORM_ID} onSubmit={handleSubmit}>
            <CheckoutBlock title={dict.checkout.deliveryContact}>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClassName}>{t.email}</span>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>{t.country}</span>
                    <select
                      name="country"
                      required
                      value={shipping.country}
                      onChange={(event) => shipping.setCountry(event.target.value)}
                      className={inputClassName}
                    >
                      {shipping.countries.map((code) => (
                        <option key={code} value={code}>
                          {countryLabel(code)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {cartHasEquipment(lines) ? (
                  <ShowroomPickupPanel
                    rates={shipping.rates}
                    selectedRateId={shipping.selectedRateId}
                    onSelectRate={shipping.setSelectedRateId}
                  />
                ) : null}

                <div>
                  <p className={labelClassName}>{t.deliveryMethod}</p>
                  <div className="mt-2">
                    {(shipping.loading || shipping.syncing) &&
                    shipping.rates.length === 0 ? (
                      <CheckoutShippingOptionsSkeleton />
                    ) : shippingError ? (
                      <p className="text-sm text-accent">{shippingError}</p>
                    ) : shipping.rates.length === 0 ? (
                      <p className="text-sm text-ink/60">{t.noDeliveryOptions}</p>
                    ) : (
                      <CheckoutShippingOptions
                        rates={shipping.rates}
                        selectedRateId={shipping.selectedRateId}
                        onSelect={shipping.setSelectedRateId}
                        syncing={shipping.syncing}
                      />
                    )}
                  </div>
                  {!shipping.needsAddress &&
                  shipping.selectedRate &&
                  pickupPointSources ? (
                    <CheckoutPickupPointSelector
                      shippingRate={shipping.selectedRate}
                      country={shipping.country}
                      locale={locale}
                      selectedPoint={pickupPoint}
                      onSelect={setPickupPoint}
                    />
                  ) : null}
                </div>

                {shipping.needsAddress ? (
                  <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={labelClassName}>{t.streetAddress}</span>
                      <input
                        type="text"
                        name="address-line1"
                        required
                        autoComplete="address-line1"
                        value={address1}
                        onChange={(event) => setAddress1(event.target.value)}
                        className={inputClassName}
                      />
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
                        className={inputClassName}
                      />
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
                        className={inputClassName}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClassName}>{t.firstName}</span>
                    <input
                      type="text"
                      name="given-name"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClassName}>{t.lastName}</span>
                    <input
                      type="text"
                      name="family-name"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClassName}>{t.phone}</span>
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
                      inputClassName={inputClassName}
                    />
                  </label>
                </div>

                <div className="border-t border-ink/10 pt-5">
                  <p className={labelClassName}>{t.paymentMethod}</p>
                  <div className="mt-2">
                    <CheckoutPaymentOptions
                      gateways={payment.gateways}
                      selectedId={payment.selectedId}
                      onSelect={payment.setSelectedId}
                      montonioOptions={montonio.options}
                      montonioLoading={montonio.loading}
                      montonioError={montonio.error}
                      montonioConfigured={montonio.configured}
                      selectedMontonioKey={
                        selectedMontonioOption
                          ? montonioOptionKey(selectedMontonioOption)
                          : null
                      }
                      onSelectMontonioOption={setSelectedMontonioOption}
                      loading={paymentLoading}
                      waitingForDelivery={paymentWaiting}
                      error={payment.error}
                      locale={locale}
                    />
                  </div>
                </div>

                {submitError ? (
                  <p className="text-sm text-accent" role="alert">
                    {submitError}
                  </p>
                ) : null}
              </div>
            </CheckoutBlock>
          </form>

          <div className="border-t border-ink/10 py-6 lg:hidden">
            <CheckoutOrderSummary {...summaryProps} variant="mobile" />
            <label className="mt-4 flex items-start gap-3 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-accent"
                required
                form={FORM_ID}
              />
              <span>
                {t.termsPrefix}{" "}
                <Link href={localizedHref(locale, "/terms")} className="text-ink hover:text-accent">
                  {t.termsLink}
                </Link>
              </span>
            </label>
            <ul className="mt-4 space-y-1 text-xs text-ink/55">
              <li>{t.securePayment}</li>
              <li className="text-xs text-ink/60">
                {dict.returns.headline}
              </li>
            </ul>
          </div>
        </div>

        <CheckoutSummaryShell className="hidden lg:block">
          <CampaignCartPanels
            placement="checkout"
            variant="compact"
            className="mb-4"
          />
          <CheckoutOrderSummary {...summaryProps} />
        </CheckoutSummaryShell>
      </div>

      <CheckoutMobilePayBar
        total={displayTotal}
        canSubmit={canSubmit}
        submitting={submitting}
        loading={shipping.loading || paymentLoading}
        formId={FORM_ID}
        payLabel={isLiveCheckoutEnabled() ? undefined : t.testPayment}
      />
    </div>
  );
}
