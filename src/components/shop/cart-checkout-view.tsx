"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCart, type CartLine } from "@/context/cart-context";
import { useCheckoutStep } from "@/context/checkout-step-context";
import {
  countryLabel,
  useCheckoutShipping,
} from "@/hooks/use-checkout-shipping";
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
import { formatPrice } from "@/lib/shop/category";
import { cartHasEquipment } from "@/lib/shop/cart-has-equipment";
import { cn } from "@/lib/utils";
import { EquipmentReturnPromise } from "@/components/shop/equipment-return-promise";
import { CampaignCartPanels } from "@/components/campaigns/campaign-cart-panels";
import { ShowroomPickupPanel } from "@/components/shop/showroom-pickup-panel";
import { EQUIPMENT_RETURN_PROMISE } from "@/data/return-policy";

const FORM_ID = "checkout-form";

const inputClassName =
  "mt-2 w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none";

const labelClassName =
  "font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/50";

function friendlyCheckoutError(message: string | null) {
  if (!message) {
    return null;
  }

  if (
    message.includes("GraphQL") ||
    message.includes("HTTP") ||
    message.includes("Internal server")
  ) {
    return "Something went wrong loading delivery options. Please try again.";
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
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-ink sm:text-xl">
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
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  compact?: boolean;
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
        aria-label="Decrease quantity"
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
        aria-label="Increase quantity"
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
  const parts = [
    line.size ? `Size: ${line.size}` : null,
    line.color ? `Colour: ${line.color}` : null,
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
}: {
  lines: CartLine[];
  onDecrease: (line: CartLine) => void;
  onIncrease: (line: CartLine) => void;
  onRemove: (line: CartLine) => void;
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
                      <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                        {line.brand}
                      </p>
                    ) : null}
                    <Link
                      href={`/shop/product/${line.slug}`}
                      className="mt-0.5 block text-sm font-semibold leading-snug text-ink hover:text-accent"
                    >
                      {line.name}
                    </Link>
                    <CartLineMeta line={line} />
                  </div>
                  <p className="shrink-0 font-display text-sm font-extrabold tabular-nums">
                    {formatPrice(lineTotal)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <CartQuantityControl
                    compact
                    value={line.quantity}
                    onDecrease={() => onDecrease(line)}
                    onIncrease={() => onIncrease(line)}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(line)}
                    className="text-xs text-ink/45 hover:text-accent"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-hidden bg-surface/80 md:block">
        <div className="grid grid-cols-[120px_minmax(0,1fr)_120px_100px] items-end gap-x-6 border-b border-ink/10 px-5 py-4">
          <span className="sr-only">Image</span>
          <span className="text-sm font-semibold text-ink/55">Product</span>
          <span className="text-center text-sm font-semibold text-ink/55">
            Quantity
          </span>
          <span className="text-right text-sm font-semibold text-ink/55">Sum</span>
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
                    <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                      {line.brand}
                    </p>
                  ) : null}
                  <Link
                    href={`/shop/product/${line.slug}`}
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
                    Remove
                  </button>
                </div>

                <CartQuantityControl
                  value={line.quantity}
                  onDecrease={() => onDecrease(line)}
                  onIncrease={() => onIncrease(line)}
                />

                <p className="text-right font-display text-lg font-extrabold tabular-nums text-ink">
                  {formatPrice(lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function CartCheckoutView() {
  const { lines, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const customer = useMemo(
    () => ({
      email,
      firstName,
      lastName,
      phone,
      address1,
      city,
      postcode,
    }),
    [email, firstName, lastName, phone, address1, city, postcode],
  );

  const shipping = useCheckoutShipping(lines, customer);
  const { setCheckoutStep } = useCheckoutStep();

  const displaySubtotal = shipping.wcSubtotal ?? subtotal;
  const displayShipping = shipping.shippingTotal;
  const displayTotal = shipping.wcTotal ?? displaySubtotal + displayShipping;

  const deliveryReady =
    Boolean(email) &&
    Boolean(firstName) &&
    Boolean(lastName) &&
    Boolean(shipping.selectedRateId) &&
    (!shipping.needsAddress || Boolean(address1 && city && postcode));

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

  const canSubmit = termsAccepted && deliveryReady;
  const shippingError = friendlyCheckoutError(shipping.error);

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    window.setTimeout(() => {
      setOrderId(`MR-${Date.now().toString(36).toUpperCase()}`);
      clearCart();
      setSubmitting(false);
    }, 900);
  };

  if (orderId) {
    return (
      <div className="site-container py-16 text-center lg:py-24">
        <p className="section-eyebrow text-accent">Order confirmed</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase sm:text-4xl">
          Thank you
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-ink/70">
          Order <span className="font-bold text-ink">{orderId}</span> is on its
          way via {shipping.selectedRate?.label ?? "your chosen delivery"}.
          We sent a confirmation to {email}.
        </p>
        <Link href="/" className="btn-accent mt-10 inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="site-container py-16 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-sm border border-ink/10 bg-surface/50 p-7 sm:p-8">
          <p className="text-lg font-semibold text-ink">
            Your cart is currently empty.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop/equipment" className="btn-accent">
              Back to shop
            </Link>
            <Link href="/shop/motorcycles" className="btn-ghost">
              Browse motorcycles
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
    loading: shipping.loading,
    formId: FORM_ID,
  };

  return (
    <div className="site-container pb-28 pt-8 lg:pb-14 lg:pt-10">
      <header className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-extrabold uppercase sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
          {formatPrice(displayTotal)} total
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <CheckoutBlock
            title="Your cart"
            action={
              <Link
                href="/shop/equipment"
                className="text-xs font-medium text-ink/45 hover:text-accent"
              >
                Continue shopping
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
            />
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
            <CheckoutBlock title="Delivery & contact">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClassName}>Email</span>
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
                    <span className={labelClassName}>Country</span>
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
                  <p className={labelClassName}>Delivery method</p>
                  <div className="mt-2">
                    {shipping.loading ? (
                      <CheckoutShippingOptionsSkeleton />
                    ) : shippingError ? (
                      <p className="text-sm text-accent">{shippingError}</p>
                    ) : shipping.rates.length === 0 ? (
                      <p className="text-sm text-ink/60">
                        No delivery options for {countryLabel(shipping.country)}.
                      </p>
                    ) : (
                      <CheckoutShippingOptions
                        rates={shipping.rates}
                        selectedRateId={shipping.selectedRateId}
                        onSelect={shipping.setSelectedRateId}
                      />
                    )}
                  </div>
                  {shipping.syncing && !shipping.loading ? (
                    <p className="mt-2 text-xs text-ink/40" aria-live="polite">
                      Updating prices…
                    </p>
                  ) : null}
                  {!shipping.needsAddress && shipping.selectedRate ? (
                    <p className="mt-3 text-xs text-ink/50">
                      Pickup point is selected securely at payment.
                    </p>
                  ) : null}
                </div>

                {shipping.needsAddress ? (
                  <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={labelClassName}>Street address</span>
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
                      <span className={labelClassName}>City</span>
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
                      <span className={labelClassName}>Postcode</span>
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
                    <span className={labelClassName}>First name</span>
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
                    <span className={labelClassName}>Last name</span>
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
                    <span className={labelClassName}>
                      Phone <span className="text-ink/30">(optional)</span>
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                </div>

                <details className="border-t border-ink/10 pt-5">
                  <summary className="cursor-pointer text-sm font-medium text-ink/55 hover:text-ink">
                    Have a discount code?
                  </summary>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="sr-only" htmlFor="coupon_code">
                      Discount code
                    </label>
                    <input
                      id="coupon_code"
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Discount code"
                      className="w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none sm:max-w-xs"
                    />
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center border border-ink/20 px-5 text-xs font-bold uppercase tracking-aggressive text-ink/70"
                    >
                      Apply
                    </button>
                  </div>
                </details>
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
                I agree to the{" "}
                <Link href="/terms" className="text-ink hover:text-accent">
                  terms & conditions
                </Link>
              </span>
            </label>
            <ul className="mt-4 space-y-1 text-xs text-ink/55">
              <li>Secure payment via Montonio — bank, card, pay later & järelmaks</li>
              <li className="text-xs text-ink/60">
                {EQUIPMENT_RETURN_PROMISE.headline}
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
        loading={shipping.loading}
        formId={FORM_ID}
      />
    </div>
  );
}
