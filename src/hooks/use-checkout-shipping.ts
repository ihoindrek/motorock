"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { CartLine } from "@/context/cart-context";
import {
  trackCheckoutCountrySelected,
  trackCheckoutShippingRatesFailed,
  trackCheckoutShippingRatesLoaded,
} from "@/lib/analytics/checkout-funnel";
import { formatCouponError } from "@/lib/checkout/format-coupon-error";
import { clearCheckoutSession, readWooSessionToken, writeWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  applyCheckoutCoupon,
  fetchAllowedCountries,
  fetchCartShipping,
  parseCartMoney,
  removeCheckoutCoupon,
  resetCheckoutSyncState,
  resolveSelectedShippingRateId,
  selectShippingRate,
  syncLocalCartToWoo,
  updateCheckoutCustomerShipping,
  type AppliedCoupon,
} from "@/lib/graphql/checkout";
import {
  countryLabel,
  defaultLocationForCountry,
  isDeliveryAddressReady,
  preferredCheckoutCountry,
  sortCountryCodes,
} from "@/lib/shop/countries";
import { formatPhoneWithCountryCode } from "@/lib/shop/phone";
import {
  shippingMethodNeedsAddress,
  type ShippingRate,
} from "@/lib/shop/shipping-method";
import {
  filterShippingRatesForCountry,
} from "@/lib/shop/shipping-showroom-pickup";

type CheckoutShippingPhase =
  | "idle"
  | "preparing"
  | "syncing_cart"
  | "loading_rates"
  | "recovering_session"
  | "syncing";

type CheckoutShippingState = {
  loading: boolean;
  countriesLoading: boolean;
  syncing: boolean;
  phase: CheckoutShippingPhase;
  statusMessage: string | null;
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
  wooSessionKey: string;
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
  cartHydrated = true,
): CheckoutShippingState {
  const dict = useDictionary();
  const locale = useLocale();
  const sortedCheckoutCountries = useCallback(
    (codes: readonly string[]) =>
      sortCountryCodes(codes, preferredCheckoutCountry(locale)),
    [locale],
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [phase, setPhase] = useState<CheckoutShippingPhase>("idle");
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
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [wooSessionKey, setWooSessionKey] = useState("");
  const sessionRef = useRef<string | null>(null);
  const bootstrapReadyRef = useRef(false);
  const syncedLinesKeyRef = useRef("");
  /** Empty until the buyer picks a country from the dropdown. */
  const countryRef = useRef("");
  const linesRef = useRef(lines);
  const customerRef = useRef(customer);
  const committedAddressKeyRef = useRef("");
  const countriesRef = useRef(countries);
  countriesRef.current = countries;

  customerRef.current = customer;
  countryRef.current = country;
  linesRef.current = lines;

  const rememberSession = useCallback((token: string | null | undefined) => {
    if (token) {
      sessionRef.current = token;
      writeWooSessionToken(token);
      setWooSessionKey(token.slice(-12));
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

  const statusMessage = useMemo(() => {
    switch (phase) {
      case "preparing":
        return dict.checkout.shippingStatusPreparing;
      case "syncing_cart":
        return dict.checkout.shippingStatusSyncingCart;
      case "loading_rates":
        return dict.checkout.shippingStatusLoadingRates;
      case "recovering_session":
        return dict.checkout.shippingStatusRecovering;
      case "syncing":
        return dict.checkout.shippingStatusUpdating;
      default:
        return null;
    }
  }, [dict.checkout, phase]);

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

      setSelectedRateIdState((current) =>
        resolveSelectedShippingRateId(current, nextRates),
      );
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
      return filterShippingRatesForCountry(cart.rates, nextCountry).length;
    },
    [activeSession, applyCart, rememberSession],
  );

  const pushCustomerShippingRef = useRef(pushCustomerShipping);
  pushCustomerShippingRef.current = pushCustomerShipping;

  /** Always load allowed countries on mount — independent of cart sync success. */
  useEffect(() => {
    let cancelled = false;

    void fetchAllowedCountries()
      .then((allowedCountries) => {
        if (!cancelled) {
          setCountries(sortedCheckoutCountries(allowedCountries));
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load shipping countries",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCountriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sortedCheckoutCountries]);

  useEffect(() => {
    setCountries((current) =>
      current.length > 0 ? sortedCheckoutCountries(current) : current,
    );
  }, [sortedCheckoutCountries]);

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
        setPhase("idle");
        return;
      }

      trackCheckoutCountrySelected(nextCountry);
      setSyncing(true);
      setPhase("loading_rates");

      void pushCustomerShipping(nextCountry, false)
        .then((rateCount) => {
          if (rateCount > 0) {
            trackCheckoutShippingRatesLoaded({
              countryCode: nextCountry,
              rateCount,
            });
            return;
          }

          trackCheckoutShippingRatesFailed({
            countryCode: nextCountry,
            reason: "zero_rates",
          });
          setError(
            "Could not load delivery options. Try again or re-add items from the product page.",
          );
        })
        .catch((cause) => {
          trackCheckoutShippingRatesFailed({
            countryCode: nextCountry,
            reason: "request_failed",
          });
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load shipping options",
          );
        })
        .finally(() => {
          setSyncing(false);
          setPhase("idle");
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
    let previousRateId: string | null = null;

    setSelectedRateIdState((current) => {
      previousRateId = current;
      return rateId;
    });
    setSyncing(true);
    setError(null);

    void (async () => {
      const applySelection = async () => {
        const result = await selectShippingRate(rateId, activeSession());
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
      };

      try {
        await applySelection();
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Could not update shipping";
        const shipCountry = countryRef.current;

        if (
          shipCountry &&
          message.includes("not an available shipping method")
        ) {
          try {
            await pushCustomerShippingRef.current(
              shipCountry,
              needsAddress && Boolean(customerRef.current.address1),
            );
            await applySelection();
            return;
          } catch (retryCause) {
            setSelectedRateIdState(previousRateId);
            setError(
              retryCause instanceof Error
                ? retryCause.message
                : "Could not update shipping",
            );
            return;
          }
        }

        setSelectedRateIdState(previousRateId);
        setError(message);
      } finally {
        setSyncing(false);
      }
    })();
  }, [activeSession, needsAddress, rememberSession]);

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
    if (!cartHydrated) {
      return;
    }

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
      setPhase(forceResync ? "recovering_session" : "preparing");

      if (forceResync) {
        resetCheckoutSyncState();
        syncedLinesKeyRef.current = "";
        bootstrapReadyRef.current = false;
      }

      try {
        const sorted =
          countriesRef.current.length > 0
            ? countriesRef.current
            : sortedCheckoutCountries(await fetchAllowedCountries());

        if (cancelled) {
          return;
        }

        if (countriesRef.current.length === 0) {
          setCountries(sorted);
        }

        setPhase(forceResync ? "recovering_session" : "syncing_cart");

        const session = await syncLocalCartToWoo(currentLines, { linesKey });

        if (cancelled) {
          return;
        }

        rememberSession(session);

        // Keep an already chosen country across cart edits. Never auto-select
        // a delivery country — the buyer must pick it from the dropdown.
        let shipCountry = "";
        if (bootstrapReadyRef.current && countryRef.current) {
          shipCountry = sorted.includes(countryRef.current)
            ? countryRef.current
            : "";
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
            setPhase("idle");
          }
          return;
        }

        setPhase(forceResync ? "recovering_session" : "loading_rates");

        const rateCount = await pushCustomerShippingRef.current(
          shipCountry,
          false,
        );

        // Zero rates with items in the cart usually means the stored session
        // is stale — its backend cart was consumed by a previous checkout
        // (e.g. the buyer came back from an external payment page). Retry
        // once with a fresh session and a full cart resync.
        if (rateCount === 0 && !forceResync && !cancelled) {
          await bootstrap(true);
          return;
        }

        if (rateCount === 0 && !cancelled) {
          trackCheckoutShippingRatesFailed({
            countryCode: shipCountry,
            reason: forceResync ? "zero_rates_after_recovery" : "zero_rates",
          });
          setError(
            forceResync
              ? dict.checkout.shippingErrorSessionRestore
              : "Could not load delivery options. Try again or re-add items from the product page.",
          );
        } else if (rateCount > 0) {
          trackCheckoutShippingRatesLoaded({
            countryCode: shipCountry,
            rateCount,
          });
        }

        syncedLinesKeyRef.current = linesKey;

        if (!cancelled) {
          bootstrapReadyRef.current = true;
          setLoading(false);
          setPhase("idle");
        }
      } catch (cause) {
        if (!cancelled && !retried) {
          retried = true;
          await bootstrap(true);
          return;
        }

        if (!cancelled) {
          clearCheckoutSession();
          trackCheckoutShippingRatesFailed({
            countryCode: countryRef.current || undefined,
            reason: "bootstrap_failed",
          });
          setError(dict.checkout.shippingErrorSessionRestore);
          bootstrapReadyRef.current = true;
          setLoading(false);
          setPhase("idle");
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [cartHydrated, dict.checkout.shippingErrorSessionRestore, linesKey, bootstrapNonce, sortedCheckoutCountries]);

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
    setPhase("syncing");

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
          setPhase("idle");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [linesKey, needsAddress, loading, pushCustomerShipping, rememberSession]);

  return {
    loading,
    countriesLoading,
    syncing,
    phase,
    statusMessage,
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
    wooSessionKey,
  };
}

export { countryLabel };
