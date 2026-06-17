"use client";

import type { ReactNode } from "react";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { CartProvider } from "@/context/cart-context";
import { CheckoutStepProvider } from "@/context/checkout-step-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CheckoutStepProvider>
        {children}
        <CartDrawer />
      </CheckoutStepProvider>
    </CartProvider>
  );
}
