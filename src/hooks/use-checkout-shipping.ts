"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/context/cart-context";
import {
  fetchAllowedCountries,
  fetchCartShipping,
  parseCartMoney,
  selectShippingRate,
  syncLocalCartToWoo,
  updateCheckoutCustomerShipping,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";
import {
  countryLabel,
  defaultLocationForCountry,
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
  wcSubtotal: number | null;
  wcTotal: number | null;
  setCountry: (country: string) => void;
  setSelectedRateId: (rateId: string) => void;
  refreshShipping: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>(["EE"]);
  const [country, setCountryState] = useState("EE");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateIdState] = useState<string | null>(
    null,
  );
  const [shippingTotal, setShippingTotal] = useState(0);
  const [wcSubtotal, setWcSubtotal] = useState<number | null>(null);
  const [wcTotal, setWcTotal] = useState<number | null>(null);
  const sessionRef = useRef<string | null>(null);
  const bootstrapReadyRef = useRef(false);
  const syncedLinesKeyRef = useRef("");
  const countryRef = useRef("EE");
  const linesRef = useRef(lines);
  const customerRef = useRef(customer);

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
    },
    [activeSession, applyCart, rememberSession],
  );

  const setCountry = useCallback(
    (nextCountry: string) => {
      countryRef.current = nextCountry;
      setCountryState(nextCountry);
      setSelectedRateIdState(null);
      setSyncing(true);
      setError(null);

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

  const setSelectedRateId = useCallback((rateId: string) => {
    setSyncing(true);
    setError(null);

    void selectShippingRate(rateId, activeSession())
      .then((result) => {
        rememberSession(result.sessionToken);
        setRates(filterShippingRatesForCountry(result.rates, countryRef.current));
        setShippingTotal(parseCartMoney(result.cart.shippingTotal));
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
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);

      try {
        const [allowedCountries, session] = await Promise.all([
          fetchAllowedCountries(),
          syncLocalCartToWoo(currentLines, { linesKey }),
        ]);

        if (cancelled) {
          return;
        }

        rememberSession(session);
        const sorted = sortCountryCodes(allowedCountries);
        setCountries(sorted);

        const defaultCountry = sorted.includes("EE") ? "EE" : sorted[0];
        const shipCountry = bootstrapReadyRef.current
          ? countryRef.current
          : defaultCountry;

        if (!bootstrapReadyRef.current) {
          countryRef.current = shipCountry;
          setCountryState(shipCountry);
        }

        await pushCustomerShipping(shipCountry, false);
        syncedLinesKeyRef.current = linesKey;

        if (!cancelled) {
          bootstrapReadyRef.current = true;
          setLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not prepare checkout",
          );
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [linesKey, pushCustomerShipping, rememberSession]);

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
        await pushCustomerShipping(
          countryRef.current,
          needsAddress && Boolean(customerRef.current.address1),
        );
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

  useEffect(() => {
    if (!bootstrapReadyRef.current || loading || !needsAddress) {
      return;
    }

    const current = customerRef.current;
    if (!current.address1 || !current.city || !current.postcode) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSyncing(true);
      void pushCustomerShipping(countryRef.current, true)
        .catch((cause) => {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not update delivery address",
          );
        })
        .finally(() => {
          setSyncing(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    needsAddress,
    customer.address1,
    customer.city,
    customer.postcode,
    loading,
    pushCustomerShipping,
  ]);

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
    wcSubtotal,
    wcTotal,
    setCountry,
    setSelectedRateId,
    refreshShipping,
  };
}

export { countryLabel };
