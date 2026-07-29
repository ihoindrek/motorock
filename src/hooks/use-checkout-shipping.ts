"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDictionary } from "@/context/locale-context";
import type { CartLine } from "@/context/cart-context";
import { formatCouponError } from "@/lib/checkout/format-coupon-error";
import { clearCheckoutSession } from "@/lib/graphql/checkout-client";
import {
  applyCheckoutCoupon,
  fetchAllowedCountries,
  fetchCartShipping,
  parseCartMoney,
  removeCheckoutCoupon,
  resetCheckoutSyncState,
  selectShippingRate,
  syncLocalCartToWoo,
  updateCheckoutCustomerShipping,
  type AppliedCoupon,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  countryLabel,
  defaultLocationForCountry,
  isDeliveryAddressReady,
  sortCountryCodes,
} from "@/lib/shop/countries";
import { formatPhoneWithCountryCode } from "@/lib/shop/phone";
import {
  shippingMethodNeedsAddress,
  type ShippingRate,
} from "@/lib/shop/shipping-method";
import { pickDefaultShippingRateId } from "@/lib/shop/shipping-rate-priority";
import { filterShippingRatesForCountry } from "@/lib/shop/shipping-showroom-pickup";

type CheckoutShippingState = {
  loading: boolean;
  syncing: boolean;
  error: string | null;
  countries: string[];
  country: string;
  rates: ShippingRate[];
  selectedRateId: string | null;
  selectedRate: ShippingRate | null;
  needsAddress: boolean;
  shippingTotal: number;
  discountTotal: number;
  appliedCoupons: AppliedCoupon[];
  wcSubtotal: number | null;
  wcTotal: number | null;
  couponLoading: boolean;
  couponError: string | null;
  setCountry: (country: string) => void;
  setSelectedRateId: (rateId: string) => void;
  refreshShipping: () => Promise<void>;
  retryBootstrap: () => void;
  applyCoupon: (code: string) => Promise<{ ok: boolean }>;
  removeCoupon: (code: string) => Promise<{ ok: boolean }>;
  commitDeliveryAddress: () => void;
};

export function useCheckoutShipping(
  lines: CartLine[],
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    phoneCountry: string;
    address1: string;
    city: string;
    postcode: string;
  },
): CheckoutShippingState {
  const dict = useDictionary();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountryState] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateIdState] = useState<string | null>(
    null,
  );
  const [shippingTotal, setShippingTotal] = useState(0);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [wcSubtotal, setWcSubtotal] = useState<number | null>(null);
  const [wcTotal, setWcTotal] = useState<number | null>(null);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const sessionRef = useRef<string | null>(null);
  const bootstrapReadyRef = useRef(false);
  const syncedLinesKeyRef = useRef("");
  /** Empty until the buyer picks a country (or geo fills a valid one). */
  const countryRef = useRef("");
  const linesRef = useRef(lines);
  const customerRef = useRef(customer);
  const committedAddressKeyRef = useRef("");

  customerRef.current = customer;
  countryRef.current = country;
  linesRef.current = lines;

  const rememberSession = useCallback((token: string | null | undefined) => {
    if (token) {
      sessionRef.current = token;
    }
  }, []);

  const activeSession = useCallback(
    () => readWooSessionToken() ?? sessionRef.current,
    [],
  );

  const selectedRate = useMemo(
    () => rates.find((rate) => rate.id === selectedRateId) ?? null,
    [rates, selectedRateId],
  );

  const needsAddress = selectedRate
    ? shippingMethodNeedsAddress(selectedRate)
    : false;

  const linesKey = useMemo(
    () =>
      lines
        .map(
          (line) =>
            `${line.slug}:${line.size ?? ""}:${line.quantity}:${line.variationId ?? ""}`,
        )
        .join("|"),
    [lines],
  );

  const applyCart = useCallback(
    (
      cart: Awaited<ReturnType<typeof fetchCartShipping>>,
      options?: { country?: string },
    ) => {
      const shipCountry = options?.country ?? countryRef.current;
      const nextRates = filterShippingRatesForCountry(cart.rates, shipCountry);

      rememberSession(cart.sessionToken);
      setRates(nextRates);
      setShippingTotal(parseCartMoney(cart.cart.shippingTotal));
      setDiscountTotal(cart.discountTotal);
      setAppliedCoupons(cart.appliedCoupons);
      setWcSubtotal(parseCartMoney(cart.cart.subtotal));
      setWcTotal(parseCartMoney(cart.cart.total));

      const chosen =
        cart.cart.chosenShippingMethods.find((rateId) =>
          nextRates.some((rate) => rate.id === rateId),
        ) ??
        pickDefaultShippingRateId(nextRates) ??
        null;

      setSelectedRateIdState((current) => {
        if (current && nextRates.some((rate) => rate.id === current)) {
          return current;
        }

        return chosen;
      });
    },
    [rememberSession],
  );

  const refreshShipping = useCallback(async () => {
    const cart = await fetchCartShipping(activeSession());
    applyCart(cart);
  }, [activeSession, applyCart]);

  const pushCustomerShipping = useCallback(
    async (nextCountry: string, withAddress: boolean) => {
      const current = customerRef.current;
      const fallback = defaultLocationForCountry(nextCountry);

      const { sessionToken } = await updateCheckoutCustomerShipping(
        {
          country: nextCountry,
          email: current.email || undefined,
          firstName: current.firstName || undefined,
          lastName: current.lastName || undefined,
          phone: current.phone
            ? formatPhoneWithCountryCode(
                current.phoneCountry || nextCountry,
                current.phone,
              )
            : undefined,
          postcode:
            withAddress && current.postcode
              ? current.postcode
              : fallback.postcode,
          city:
            withAddress && current.city ? current.city : fallback.city,
          address1:
            withAddress && current.address1 ? current.address1 : undefined,
        },
        activeSession(),
      );

      rememberSession(sessionToken);
      const cart = await fetchCartShipping(activeSession());
      applyCart(cart, { country: nextCountry });
      return cart.rates.length;
    },
    [activeSession, applyCart, rememberSession],
  );

  const setCountry = useCallback(
    (nextCountry: string) => {
      countryRef.current = nextCountry;
      committedAddressKeyRef.current = "";
      setCountryState(nextCountry);
      setSelectedRateIdState(null);
      setRates([]);
      setError(null);

      if (!nextCountry) {
        setSyncing(false);
        return;
      }

      setSyncing(true);

      void pushCustomerShipping(nextCountry, false)
        .catch((cause) => {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load shipping options",
          );
        })
        .finally(() => {
          setSyncing(false);
        });
    },
    [pushCustomerShipping],
  );

  const commitDeliveryAddress = useCallback(() => {
    if (!bootstrapReadyRef.current || loading || !needsAddress) {
      return;
    }

    const current = customerRef.current;
    const shipCountry = countryRef.current;

    if (!isDeliveryAddressReady(shipCountry, current)) {
      return;
    }

    const addressKey = [
      shipCountry,
      current.address1.trim(),
      current.city.trim(),
      current.postcode.trim(),
    ].join("|");

    if (addressKey === committedAddressKeyRef.current) {
      return;
    }

    committedAddressKeyRef.current = addressKey;
    setSyncing(true);
    setError(null);

    void pushCustomerShipping(shipCountry, true)
      .catch((cause) => {
        committedAddressKeyRef.current = "";
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not update delivery address",
        );
      })
      .finally(() => {
        setSyncing(false);
      });
  }, [loading, needsAddress, pushCustomerShipping]);

  const setSelectedRateId = useCallback((rateId: string) => {
    setSyncing(true);
    setError(null);

    void selectShippingRate(rateId, activeSession())
      .then((result) => {
        rememberSession(result.sessionToken);
        setRates(filterShippingRatesForCountry(result.rates, countryRef.current));
        setShippingTotal(parseCartMoney(result.cart.shippingTotal));
        setDiscountTotal(result.discountTotal);
        setAppliedCoupons(result.appliedCoupons);
        setWcTotal(parseCartMoney(result.cart.total));

        const appliedRateId = result.chosenRateId ?? rateId;
        if (result.chosenRateId && result.chosenRateId !== rateId) {
          setSelectedRateIdState(result.chosenRateId);
          setError("This delivery option could not be applied. Please choose another method.");
          return;
        }

        setSelectedRateIdState(appliedRateId);
      })
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Could not update shipping",
        );
      })
      .finally(() => {
        setSyncing(false);
      });
  }, [activeSession, rememberSession]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return { ok: false };
      }

      setCouponLoading(true);
      setCouponError(null);

      try {
        const result = await applyCheckoutCoupon(trimmed, activeSession());
        applyCart(result);
        return { ok: true };
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : dict.checkout.couponApplyFailed;
        setCouponError(formatCouponError(message, dict.checkout));
        return { ok: false };
      } finally {
        setCouponLoading(false);
      }
    },
    [activeSession, applyCart, dict.checkout],
  );

  const removeCoupon = useCallback(
    async (code: string) => {
      setCouponLoading(true);
      setCouponError(null);

      try {
        const result = await removeCheckoutCoupon(code, activeSession());
        applyCart(result);
        return { ok: true };
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : dict.checkout.couponRemoveFailed;
        setCouponError(formatCouponError(message, dict.checkout));
        return { ok: false };
      } finally {
        setCouponLoading(false);
      }
    },
    [activeSession, applyCart, dict.checkout],
  );

  useEffect(() => {
    if (
      !bootstrapReadyRef.current ||
      loading ||
      syncing ||
      rates.length === 0 ||
      selectedRateId
    ) {
      return;
    }

    const defaultId = pickDefaultShippingRateId(rates);
    if (defaultId) {
      setSelectedRateId(defaultId);
    }
  }, [rates, selectedRateId, loading, syncing, setSelectedRateId]);

  useEffect(() => {
    const currentLines = linesRef.current;

    if (currentLines.length === 0) {
      bootstrapReadyRef.current = false;
      syncedLinesKeyRef.current = "";
      setRates([]);
      setSelectedRateIdState(null);
      setDiscountTotal(0);
      setAppliedCoupons([]);
      setCouponError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let retried = false;

    async function bootstrap(forceResync = false) {
      setLoading(true);
      setError(null);

      if (forceResync) {
        resetCheckoutSyncState();
        syncedLinesKeyRef.current = "";
        bootstrapReadyRef.current = false;
      }

      try {
        // Load countries before cart sync so the dropdown stays usable when sync
        // fails (e.g. variation mismatch) — previously Promise.all blocked both.
        const allowedCountries = await fetchAllowedCountries();

        if (cancelled) {
          return;
        }

        const sorted = sortCountryCodes(allowedCountries);
        setCountries(sorted);

        const [session, geoPayload] = await Promise.all([
          syncLocalCartToWoo(currentLines, { linesKey }),
          fetch("/api/geo")
            .then(async (response) =>
              response.ok ? ((await response.json()) as { country?: string }) : null,
            )
            .catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        rememberSession(session);

        // Keep an already chosen country across cart edits; otherwise prefer
        // IP geo when it maps to an allowed shipping country. Never force EE.
        let shipCountry = "";
        if (bootstrapReadyRef.current && countryRef.current) {
          shipCountry = sorted.includes(countryRef.current)
            ? countryRef.current
            : "";
        } else {
          const detected = geoPayload?.country?.trim().toUpperCase() ?? "";
          const phoneHint =
            customerRef.current.phoneCountry?.trim().toUpperCase() ?? "";
          shipCountry =
            (detected && sorted.includes(detected) ? detected : "") ||
            (phoneHint && sorted.includes(phoneHint) ? phoneHint : "");
        }

        countryRef.current = shipCountry;
        setCountryState(shipCountry);

        if (!shipCountry) {
          setRates([]);
          setSelectedRateIdState(null);
          syncedLinesKeyRef.current = linesKey;
          if (!cancelled) {
            bootstrapReadyRef.current = true;
            setLoading(false);
          }
          return;
        }

        const rateCount = await pushCustomerShipping(shipCountry, false);

        // Zero rates with items in the cart usually means the stored session
        // is stale — its backend cart was consumed by a previous checkout
        // (e.g. the buyer came back from an external payment page). Retry
        // once with a fresh session and a full cart resync.
        if (rateCount === 0 && !forceResync && !cancelled) {
          await bootstrap(true);
          return;
        }

        syncedLinesKeyRef.current = linesKey;

        if (!cancelled) {
          bootstrapReadyRef.current = true;
          setLoading(false);
        }
      } catch (cause) {
        if (!cancelled && !retried) {
          retried = true;
          await bootstrap(true);
          return;
        }

        if (!cancelled) {
          clearCheckoutSession();
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not prepare checkout",
          );
          bootstrapReadyRef.current = true;
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [linesKey, bootstrapNonce, pushCustomerShipping, rememberSession]);

  /** Re-run the full cart sync after a transient failure (e.g. network). */
  const retryBootstrap = useCallback(() => {
    resetCheckoutSyncState();
    syncedLinesKeyRef.current = "";
    bootstrapReadyRef.current = false;
    setBootstrapNonce((nonce) => nonce + 1);
  }, []);

  useEffect(() => {
    if (!bootstrapReadyRef.current || loading || syncedLinesKeyRef.current === linesKey) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setError(null);

    void syncLocalCartToWoo(linesRef.current, { linesKey })
      .then(async (session) => {
        rememberSession(session);
        if (countryRef.current) {
          await pushCustomerShipping(
            countryRef.current,
            needsAddress && Boolean(customerRef.current.address1),
          );
        }
        syncedLinesKeyRef.current = linesKey;
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not sync cart",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [linesKey, needsAddress, loading, pushCustomerShipping, rememberSession]);

  return {
    loading,
    syncing,
    error,
    countries,
    country,
    rates,
    selectedRateId,
    selectedRate,
    needsAddress,
    shippingTotal,
    discountTotal,
    appliedCoupons,
    wcSubtotal,
    wcTotal,
    couponLoading,
    couponError,
    setCountry,
    setSelectedRateId,
    refreshShipping,
    retryBootstrap,
    applyCoupon,
    removeCoupon,
    commitDeliveryAddress,
  };
}

export { countryLabel };
