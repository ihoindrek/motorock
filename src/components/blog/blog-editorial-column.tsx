import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const blogEditorialShellClassName = "px-5 sm:px-8 lg:px-12";

export const blogEditorialColumnClassName =
  "mx-auto w-full max-w-site lg:max-w-3xl";

type BlogEditorialColumnProps = {
  children: ReactNode;
  className?: string;
};

export function BlogEditorialColumn({
  children,
  className,
}: BlogEditorialColumnProps) {
  return (
    <div className={cn(blogEditorialColumnClassName, className)}>{children}</div>
  );
}
