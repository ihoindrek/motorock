"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/cart-context";
import { CheckoutStepProvider } from "@/context/checkout-step-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CheckoutStepProvider>{children}</CheckoutStepProvider>
    </CartProvider>
  );
}
