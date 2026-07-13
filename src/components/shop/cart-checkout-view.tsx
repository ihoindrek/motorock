"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useCart, type CartLine } from "@/context/cart-context";
import { useCheckoutStep } from "@/context/checkout-step-context";
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
import { buildMontonioCheckoutMetaData, needsMontonioPaymentRemint, pickupPointReadyForCheckout } from "@/lib/checkout/montonio-checkout";
import {
  buildCheckoutInputAddresses,
  MONTONIO_PAYMENT_METHOD_ID,
  submitCheckout,
  updateCheckoutCustomerShipping,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  CheckoutMobilePayBar,
  CheckoutMobileStepBar,
  CheckoutOrderSummary,
  CheckoutSummaryShell,
} from "@/components/shop/checkout-order-summary";
import {
  CheckoutShippingOptions,
  CheckoutShippingOptionsSkeleton,
} from "@/components/shop/checkout-shipping-options";
import { formatColorLabel } from "@/lib/shop/product-color-swatches";
import { cartLineThumbnailClass } from "@/lib/shop/cart-line-image";
import { formatSizeLabel } from "@/lib/shop/size-label";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { Price } from "@/components/shop/price";
import { cartHasEquipment } from "@/lib/shop/cart-has-equipment";
import { defaultLocationForCountry } from "@/lib/shop/countries";
import {
  formatPhoneWithCountryCode,
  isValidCheckoutPhone,
  stripCountryDialCode,
} from "@/lib/shop/phone";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBeginCheckout,
  trackViewCart,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { EquipmentReturnPromise } from "@/components/shop/equipment-return-promise";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";
import { ShowroomPickupPanel } from "@/components/shop/showroom-pickup-panel";
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
import {
  resolvePickupPointSources,
  shippingMethodNeedsPickupPoint,
} from "@/lib/shipping/pickup-carrier";
import type { PickupPoint } from "@/types/pickup-point";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import { montonioOptionKey, montonioOptionLabel } from "@/types/montonio-payment";

const FORM_ID = "checkout-form";

function checkoutPanelClass(mobileStep: 1 | 2 | 3, panelStep: 1 | 2 | 3) {
  return cn(mobileStep === panelStep ? "block" : "hidden", "lg:block");
}

function scrollCheckoutToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function deriveCheckoutProgressStep(input: {
  itemCount: number;
  mobileStep: 1 | 2 | 3;
}): 1 | 2 | 3 {
  if (input.itemCount === 0) {
    return 1;
  }

  return input.mobileStep;
}

const inputClassName =
  "mt-2 w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none";

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

  if (/please select a pickup point/i.test(message)) {
    return locale === "et"
      ? "Valitud pakiautomaat ei jõudnud tellimusele. Värskenda lehte ja proovi uuesti."
      : "The selected pickup point could not be applied to your order. Refresh the page and try again.";
  }

  if (
    /product not found|choose a size|could not add items|could not add items to checkout/i.test(
      message,
    )
  ) {
    return message;
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
  hideTitleOnMobile = false,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  hideTitleOnMobile?: boolean;
}) {
  return (
    <section className="border-t border-ink/10 py-4 first:border-t-0 first:pt-0 lg:py-10">
      <div
        className={cn(
          "mb-5 flex items-end justify-between gap-4",
          hideTitleOnMobile && "max-lg:mb-0 max-lg:justify-end",
        )}
      >
        <h2
          className={cn(
            "font-body text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl",
            hideTitleOnMobile && "max-lg:sr-only",
          )}
        >
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
                href={localizedProductHref(line.slug, locale)}
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
          paymentReturnError: "Payment was cancelled or failed. Please try again.",
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
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [mobileStepError, setMobileStepError] = useState<string | null>(null);
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

  const shipping = useCheckoutShipping(lines, customer);
  const paymentReady =
    !shipping.loading && shipping.rates.length > 0 && !shipping.syncing;
  const paymentRefreshKey = `${shipping.country}:${shipping.selectedRateId ?? ""}:${shipping.rates.map((rate) => rate.id).join("|")}`;
  const payment = useCheckoutPayment(paymentReady, paymentRefreshKey);
  const paymentWaiting =
    !shipping.loading && !shipping.syncing && shipping.rates.length === 0;
  const hasMontonioGateway = useMemo(
    () =>
      payment.gateways.some((gateway) =>
        gateway.id.toLowerCase().includes("montonio"),
      ),
    [payment.gateways],
  );
  const montonio = useMontonioPaymentOptions(
    shipping.country,
    paymentReady && hasMontonioGateway && isLiveCheckoutEnabled(),
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
    paymentReady &&
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
  const { setCheckoutStep, registerCheckoutStepNavigator } = useCheckoutStep();

  const needsPickupPoint = shippingMethodNeedsPickupPoint(shipping.selectedRate);
  const pickupPointSources = useMemo(() => {
    if (!shipping.selectedRate || !needsPickupPoint) {
      return null;
    }

    return resolvePickupPointSources(shipping.selectedRate, shipping.country);
  }, [needsPickupPoint, shipping.country, shipping.selectedRate]);

  const displaySubtotal = shipping.wcSubtotal ?? subtotal;
  const displayShipping = shipping.shippingTotal;
  const displayDiscount = shipping.discountTotal;
  const displayTotal = shipping.wcTotal ?? displaySubtotal + displayShipping - displayDiscount;

  useEffect(() => {
    if (itemCount === 0 || mobileStep !== 1 || checkoutAnalyticsRef.current.viewCart) {
      return;
    }

    checkoutAnalyticsRef.current.viewCart = true;
    trackViewCart(lines);
  }, [itemCount, lines, mobileStep]);

  useEffect(() => {
    if (itemCount === 0 || mobileStep !== 2 || checkoutAnalyticsRef.current.beginCheckout) {
      return;
    }

    checkoutAnalyticsRef.current.beginCheckout = true;
    trackBeginCheckout(lines, displayTotal);
  }, [displayTotal, itemCount, lines, mobileStep]);

  useEffect(() => {
    if (
      mobileStep !== 3 ||
      !payment.selectedId ||
      checkoutAnalyticsRef.current.payment
    ) {
      return;
    }

    checkoutAnalyticsRef.current.payment = true;
    trackAddPaymentInfo({
      lines,
      paymentType: payment.selectedId,
      value: displayTotal,
    });
  }, [displayTotal, lines, mobileStep, payment.selectedId]);

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

  const deliveryReady =
    Boolean(email) &&
    Boolean(firstName) &&
    Boolean(lastName) &&
    isValidCheckoutPhone(phoneCountry, phone) &&
    Boolean(shipping.selectedRateId) &&
    (!shipping.needsAddress || Boolean(address1 && city && postcode)) &&
    (!needsPickupPoint || Boolean(pickupPoint));

  const progressStep = deriveCheckoutProgressStep({
    itemCount,
    mobileStep,
  });

  const goToMobileStep = useCallback((step: 1 | 2 | 3) => {
    setMobileStep(step);
    setMobileStepError(null);
    scrollCheckoutToTop();
  }, []);

  const selectPaymentId = useCallback(
    (gatewayId: string) => {
      paymentGatewayTouchedRef.current = true;
      payment.setSelectedId(gatewayId);
    },
    [payment.setSelectedId],
  );

  const handleContinueToDelivery = () => {
    if (itemCount === 0) {
      return;
    }

    goToMobileStep(2);
  };

  const handleContinueToPayment = () => {
    if (!deliveryReady) {
      setMobileStepError(dict.checkout.completeDeliveryFirst);
      document
        .querySelector<HTMLElement>("#checkout-form input, #checkout-form select")
        ?.focus();
      return;
    }

    if (!checkoutAnalyticsRef.current.shipping) {
      checkoutAnalyticsRef.current.shipping = true;
      trackAddShippingInfo({
        lines,
        shippingTier: shipping.selectedRate?.label ?? shipping.selectedRateId ?? "delivery",
        value: displayTotal,
      });
    }

    goToMobileStep(3);
  };

  const canSubmit =
    termsAccepted &&
    deliveryReady &&
    Boolean(payment.selectedId) &&
    !paymentLoading &&
    !payment.error &&
    (!needsMontonioProvider || Boolean(selectedMontonioOption)) &&
    (!needsPickupPoint ||
      Boolean(
        pickupPoint &&
          (!isLiveCheckoutEnabled() || pickupPointReadyForCheckout(pickupPoint)),
      ));
  const shippingError = friendlyCheckoutError(
    shipping.error,
    dict.checkout.shippingError,
    locale,
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
    if (
      montonio.loading ||
      !selectedPaymentGateway ||
      montonio.options.length === 0
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
      if (
        !paymentGatewayTouchedRef.current &&
        payment.selectedId === "wc_montonio_card" &&
        visiblePaymentGateways.some(
          (gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID,
        )
      ) {
        payment.setSelectedId(MONTONIO_PAYMENT_METHOD_ID);
      }
      return;
    }

    const fallbackId =
      visiblePaymentGateways.find(
        (gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID,
      )?.id ??
      visiblePaymentGateways[0]?.id ??
      null;

    payment.setSelectedId(fallbackId);
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

    setMobileStep(3);
    setSubmitError(
      paymentError === "Payment cancelled" || paymentError === "Payment failed"
        ? t.paymentReturnError
        : paymentError,
    );
    scrollCheckoutToTop();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("payment_error");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, t.paymentReturnError]);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam === "2") {
      setMobileStep(2);
      scrollCheckoutToTop();
    } else if (stepParam === "3") {
      setMobileStep(3);
      scrollCheckoutToTop();
    }
  }, [searchParams]);

  useEffect(() => {
    registerCheckoutStepNavigator((step) => {
      if (step === 3 && !deliveryReady) {
        setMobileStepError(dict.checkout.completeDeliveryFirst);
        setMobileStep(2);
        scrollCheckoutToTop();
        return;
      }

      goToMobileStep(step);
    });

    return () => {
      registerCheckoutStepNavigator(null);
    };
  }, [
    deliveryReady,
    dict.checkout.completeDeliveryFirst,
    goToMobileStep,
    registerCheckoutStepNavigator,
  ]);

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
        selectedMontonioOption
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
        needsMontonioPaymentRemint(selectedMontonioOption) &&
        result.orderDatabaseId &&
        selectedMontonioOption
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
                ? "Kaardimakse käivitamine ebaõnnestus. Proovi uuesti."
                : "Could not start card payment. Please try again."),
          );
        }

        redirectUrl = remintBody.redirect;
      }

      if (redirectUrl) {
        clearCart();
        window.location.assign(redirectUrl);
        return;
      }

      setOrderId(result.orderNumber ?? `MR-${Date.now().toString(36).toUpperCase()}`);
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
              shipping.selectedRate?.label ?? t.deliveryChosen,
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
    termsAccepted,
    onTermsChange: setTermsAccepted,
    canSubmit,
    submitting,
    loading: shipping.loading || paymentLoading,
    formId: FORM_ID,
    payLabel: isLiveCheckoutEnabled() ? undefined : t.testPayment,
  };

  return (
    <div className="site-container max-lg:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-14 lg:pt-10 pt-4">
      <header className="mb-3 max-w-2xl lg:mb-6">
        <h1 className="text-3xl font-extrabold uppercase sm:text-4xl">
          {t.checkout}
        </h1>
        <p className="mt-2 text-sm text-ink/60 lg:hidden">
          {mobileStep === 1
            ? dict.checkout.yourCart
            : mobileStep === 2
              ? dict.checkout.deliveryContact
              : dict.checkout.pay}
          {" · "}
          <span className="font-body font-extrabold tabular-nums text-ink">
            {formatCheckoutPrice(displayTotal, locale)}
          </span>
        </p>
        <p className="mt-2 hidden text-sm text-ink/60 lg:block">
          {itemCount} {itemCount === 1 ? t.item : t.items} ·{" "}
          <span className="font-body font-extrabold tabular-nums text-ink">
            {formatCheckoutPrice(displayTotal, locale)}
          </span>{" "}
          {t.total}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <div className={checkoutPanelClass(mobileStep, 1)}>
          <CheckoutBlock
            title={dict.checkout.yourCart}
            hideTitleOnMobile
            action={
              <Link
                href={localizedHref(locale, buildEquipmentHubHref(locale))}
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    className="w-full border border-ink/15 bg-paper px-4 py-3 text-base uppercase focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={
                      shipping.couponLoading ||
                      shipping.loading ||
                      shipping.syncing ||
                      !couponCode.trim()
                    }
                    className="inline-flex min-h-11 items-center justify-center border border-ink/20 px-5 text-xs font-bold uppercase tracking-aggressive text-ink/70 transition-colors hover:border-ink/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {shipping.couponLoading ? dict.checkout.applyingCoupon : dict.checkout.apply}
                  </button>
                </div>
                {shipping.couponError ? (
                  <p className="text-sm text-accent" role="alert">
                    {shipping.couponError}
                  </p>
                ) : null}
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
              className="mt-4 max-lg:mb-0 lg:mt-6 lg:hidden"
            />
          </CheckoutBlock>
          </div>

          <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
            <div className={checkoutPanelClass(mobileStep, 2)}>
            <CheckoutBlock
              title={dict.checkout.deliveryContact}
              action={
                <button
                  type="button"
                  onClick={() => goToMobileStep(1)}
                  className="text-xs font-medium text-ink/45 hover:text-accent lg:hidden"
                >
                  {dict.checkout.back}
                </button>
              }
            >
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
                        onBlur={shipping.commitDeliveryAddress}
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
                        onBlur={shipping.commitDeliveryAddress}
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
                        onBlur={shipping.commitDeliveryAddress}
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

                {mobileStepError ? (
                  <p className="text-sm text-accent lg:hidden" role="alert">
                    {mobileStepError}
                  </p>
                ) : null}
              </div>
            </CheckoutBlock>
            </div>

            <div className={checkoutPanelClass(mobileStep, 3)}>
            <CheckoutBlock
              title={dict.checkout.pay}
              action={
                <button
                  type="button"
                  onClick={() => goToMobileStep(2)}
                  className="text-xs font-medium text-ink/45 hover:text-accent lg:hidden"
                >
                  {dict.checkout.back}
                </button>
              }
            >
              <div className="space-y-6">
                <div className="border-t border-ink/10 pt-5 lg:border-0 lg:pt-0">
                  <p className={labelClassName}>{t.paymentMethod}</p>
                  <div className="mt-2">
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
            </div>
          </form>

          <div
            className={cn(
              "border-t border-ink/10 py-4 lg:hidden",
              mobileStep !== 3 && "hidden",
            )}
          >
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

      {mobileStep === 1 ? (
        <CheckoutMobileStepBar
          continueLabel={dict.checkout.continueToDelivery}
          onContinue={handleContinueToDelivery}
          disabled={itemCount === 0 || shipping.loading}
          total={displayTotal}
        />
      ) : null}

      {mobileStep === 2 ? (
        <CheckoutMobileStepBar
          continueLabel={dict.checkout.continueToPayment}
          onContinue={handleContinueToPayment}
          disabled={shipping.loading || shipping.syncing}
          showBack
          onBack={() => goToMobileStep(1)}
          backLabel={dict.checkout.back}
          total={displayTotal}
        />
      ) : null}

      {mobileStep === 3 ? (
        <CheckoutMobilePayBar
          total={displayTotal}
          canSubmit={canSubmit}
          submitting={submitting}
          loading={shipping.loading || paymentLoading}
          formId={FORM_ID}
          payLabel={isLiveCheckoutEnabled() ? undefined : t.testPayment}
        />
      ) : null}
    </div>
  );
}
