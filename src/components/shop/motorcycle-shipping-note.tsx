"use client";

import Link from "next/link";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { cn } from "@/lib/utils";

type MotorcycleShippingNoteProps = {
  className?: string;
};

export function MotorcycleShippingNote({
  className,
}: MotorcycleShippingNoteProps) {
  const locale = useLocale();
  const dict = useDictionary();

  return (
    <p className={cn("text-sm leading-relaxed text-ink/65", className)}>
      {dict.pdp.motorcycleShippingNote}{" "}
      <Link
        href={localizedHref(locale, "/shipping")}
        className="underline underline-offset-2 hover:text-ink"
      >
        {dict.pdp.shippingInfoLink}
      </Link>
    </p>
  );
}
