import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BlogBadgeProps = {
  children: ReactNode;
  variant?: "default" | "accent" | "active" | "on-dark";
  className?: string;
};

const variantClassName = {
  default:
    "border border-ink/15 bg-paper text-ink/70",
  accent: "bg-accent text-paper",
  active: "bg-ink text-paper",
  "on-dark": "border border-paper/15 bg-ink/35 text-paper/85 backdrop-blur-sm",
} as const;

export function BlogBadge({
  children,
  variant = "default",
  className,
}: BlogBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-body text-[10px] font-bold uppercase tracking-aggressive",
        variantClassName[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function blogFilterBadgeClassName(active: boolean) {
  return cn(
    "inline-flex min-h-8 items-center rounded-full px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-aggressive transition-colors",
    active
      ? "bg-ink text-paper"
      : "border border-ink/15 bg-paper/90 text-ink/55 hover:border-ink/25 hover:text-ink",
  );
}
