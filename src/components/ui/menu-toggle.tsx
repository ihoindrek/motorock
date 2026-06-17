"use client";

import type React from "react";
import { cn } from "@/lib/utils";

type MenuToggleProps = React.ComponentProps<"svg"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MenuToggle({
  open,
  onOpenChange,
  className,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  ...props
}: MenuToggleProps) {
  return (
    <button
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={() => onOpenChange(!open)}
      className="flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
    >
      <svg
        strokeWidth={strokeWidth}
        fill={fill}
        stroke={stroke}
        viewBox="0 0 32 32"
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        className={cn(
          "size-4 transition-transform duration-[600ms] ease-out",
          open && "-rotate-45",
          className,
        )}
        aria-hidden="true"
        {...props}
      >
        <path
          className={cn(
            "transition-all duration-[600ms] ease-out",
            open
              ? "[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]"
              : "[stroke-dasharray:12_63]",
          )}
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
        />
        <path d="M7 16 27 16" />
      </svg>
    </button>
  );
}
