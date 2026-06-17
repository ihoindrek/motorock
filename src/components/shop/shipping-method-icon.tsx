import Image from "next/image";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import {
  resolveShippingMethodVisual,
  type ShippingMethodVisual,
} from "@/lib/shop/shipping-method-visual";
import { cn } from "@/lib/utils";

function ParcelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <rect
        x="4"
        y="6"
        width="16"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="9" y="11" width="6" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function CourierIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M3 8.5h11v7H3v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 10.5h3.2L19 13.2v2.3h-5v-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="17" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 11.5h11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PickupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M4 10 6 5h12l2 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 10h14v9H5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 14h4v5h-4v-5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FallbackIcon({ icon }: { icon: ShippingMethodVisual & { kind: "icon" } }) {
  switch (icon.icon) {
    case "courier":
      return <CourierIcon />;
    case "store":
      return <StoreIcon />;
    case "pickup":
      return <PickupIcon />;
    default:
      return <ParcelIcon />;
  }
}

export function ShippingMethodIcon({
  rate,
  className,
}: {
  rate: ShippingRate;
  className?: string;
}) {
  const visual = resolveShippingMethodVisual(rate);

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-white text-ink/75",
        visual.kind === "logo" ? "p-1.5" : "p-2",
        className,
      )}
    >
      {visual.kind === "logo" ? (
        <Image
          src={visual.src}
          alt=""
          width={32}
          height={32}
          className="h-7 w-auto max-w-full object-contain"
        />
      ) : (
        <FallbackIcon icon={visual} />
      )}
    </span>
  );
}
