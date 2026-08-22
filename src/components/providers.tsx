"use client";

import type { ReactNode } from "react";
import { DeploymentRecovery } from "@/components/client/deployment-recovery";
import { CartProvider } from "@/context/cart-context";
import { CheckoutStepProvider } from "@/context/checkout-step-context";
import { WishlistProvider } from "@/context/wishlist-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CheckoutStepProvider>
          <DeploymentRecovery />
          {children}
        </CheckoutStepProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
