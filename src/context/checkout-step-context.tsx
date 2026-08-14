"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CheckoutStep = 1 | 2 | 3;

type CheckoutStepNavigator = (step: CheckoutStep) => void;

type CheckoutStepContextValue = {
  checkoutStep: CheckoutStep | null;
  setCheckoutStep: (step: CheckoutStep | null) => void;
  paymentStepReachable: boolean;
  setPaymentStepReachable: (reachable: boolean) => void;
  navigateToCheckoutStep: (step: CheckoutStep) => void;
  registerCheckoutStepNavigator: (
    navigator: CheckoutStepNavigator | null,
  ) => void;
};

const CheckoutStepContext = createContext<CheckoutStepContextValue | null>(null);

export function CheckoutStepProvider({ children }: { children: ReactNode }) {
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);
  const [paymentStepReachable, setPaymentStepReachable] = useState(false);
  const navigatorRef = useRef<CheckoutStepNavigator | null>(null);

  const registerCheckoutStepNavigator = useCallback(
    (navigator: CheckoutStepNavigator | null) => {
      navigatorRef.current = navigator;
    },
    [],
  );

  const navigateToCheckoutStep = useCallback((step: CheckoutStep) => {
    navigatorRef.current?.(step);
  }, []);

  const value = useMemo(
    () => ({
      checkoutStep,
      setCheckoutStep,
      paymentStepReachable,
      setPaymentStepReachable,
      navigateToCheckoutStep,
      registerCheckoutStepNavigator,
    }),
    [
      checkoutStep,
      paymentStepReachable,
      navigateToCheckoutStep,
      registerCheckoutStepNavigator,
    ],
  );

  return (
    <CheckoutStepContext.Provider value={value}>
      {children}
    </CheckoutStepContext.Provider>
  );
}

export function useCheckoutStep() {
  const context = useContext(CheckoutStepContext);

  if (!context) {
    throw new Error("useCheckoutStep must be used within CheckoutStepProvider");
  }

  return context;
}
