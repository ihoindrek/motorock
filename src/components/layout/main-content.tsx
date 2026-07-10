"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { stripLocaleFromPath } from "@/i18n/paths";
import { isProductPath } from "@/lib/shop/product-url";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const basePath = stripLocaleFromPath(pathname);
  const isCheckoutCart = basePath === "/cart";
  const isProductDetail = isProductPath(pathname);

  return (
    <main
      id="main-content"
      className={cn(
        isCheckoutCart || isProductDetail ? "flex-none" : "flex-1",
      )}
    >
      {children}
    </main>
  );
}
