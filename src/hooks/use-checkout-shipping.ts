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
import {
  shippingMethodNeedsAddress,
  type ShippingRate,
} from "@/lib/shop/shipping-method";
import { pickDefaultShippingRateId } from "@/lib/shop/shipping-rate-priority";

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
  const customerRef = useRef(customer);

  customerRef.current = customer;

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

  const applyCart = useCallback((cart: Awaited<ReturnType<typeof fetchCartShipping>>) => {
    rememberSession(cart.sessionToken);
    setRates(cart.rates);
    setShippingTotal(parseCartMoney(cart.cart.shippingTotal));
    setWcSubtotal(parseCartMoney(cart.cart.subtotal));
    setWcTotal(parseCartMoney(cart.cart.total));

    const chosen =
      cart.cart.chosenShippingMethods[0] ??
      pickDefaultShippingRateId(cart.rates) ??
      null;
    setSelectedRateIdState((current) => current ?? chosen);
  }, [rememberSession]);

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
          phone: current.phone || undefined,
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
      await refreshShipping();
    },
    [activeSession, refreshShipping, rememberSession],
  );

  const setCountry = useCallback(
    (nextCountry: string) => {
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
    setSelectedRateIdState(rateId);
    setSyncing(true);
    setError(null);

    void selectShippingRate(rateId, activeSession())
      .then((result) => {
        rememberSession(result.sessionToken);
        setRates(result.rates);
        setShippingTotal(parseCartMoney(result.cart.shippingTotal));
        setWcTotal(parseCartMoney(result.cart.total));
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
    if (!bootstrapReadyRef.current || loading || rates.length === 0 || selectedRateId) {
      return;
    }

    const defaultId = pickDefaultShippingRateId(rates);
    if (defaultId) {
      setSelectedRateId(defaultId);
    }
  }, [rates, selectedRateId, loading, setSelectedRateId]);

  useEffect(() => {
    if (lines.length === 0) {
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
          syncLocalCartToWoo(lines),
        ]);

        if (cancelled) {
          return;
        }

        rememberSession(session);
        const sorted = sortCountryCodes(allowedCountries);
        setCountries(sorted);

        const initialCountry = sorted.includes("EE") ? "EE" : sorted[0];
        setCountryState(initialCountry);

        await pushCustomerShipping(initialCountry, false);
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
  }, [lines, linesKey, pushCustomerShipping, rememberSession]);

  useEffect(() => {
    if (!bootstrapReadyRef.current || loading || syncedLinesKeyRef.current === linesKey) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setError(null);

    void syncLocalCartToWoo(lines)
      .then(async (session) => {
        rememberSession(session);
        await pushCustomerShipping(
          country,
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
  }, [linesKey, country, needsAddress, loading, pushCustomerShipping, lines, rememberSession]);

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
      void pushCustomerShipping(country, true)
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
    country,
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
