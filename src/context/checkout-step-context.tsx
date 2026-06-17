"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CheckoutStep = 1 | 2 | 3;

type CheckoutStepContextValue = {
  checkoutStep: CheckoutStep | null;
  setCheckoutStep: (step: CheckoutStep | null) => void;
};

const CheckoutStepContext = createContext<CheckoutStepContextValue | null>(null);

export function CheckoutStepProvider({ children }: { children: ReactNode }) {
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);

  const value = useMemo(
    () => ({
      checkoutStep,
      setCheckoutStep,
    }),
    [checkoutStep],
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
