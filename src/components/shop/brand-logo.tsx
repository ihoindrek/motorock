import Image from "next/image";
import { getBrandByName } from "@/lib/shop/brands";

type BrandLogoProps = {
  brand: string;
  size?: "sm" | "lg";
  variant?: "default" | "invert";
  className?: string;
};

export function BrandLogo({
  brand,
  size = "sm",
  variant = "default",
  className = "",
}: BrandLogoProps) {
  const config = getBrandByName(brand);

  if (!config?.logo) {
    return (
      <p
        className={`font-body text-[10px] font-bold uppercase tracking-aggressive text-accent sm:text-xs ${
          size === "lg" ? "text-xs sm:text-sm" : ""
        } ${className}`}
      >
        {brand}
      </p>
    );
  }

  const logoClass = size === "lg" ? config.logoClassLg : config.logoClass;
  const filter =
    variant === "invert" ? "brightness-0 invert" : "brightness-0";

  return (
    <Image
      src={config.logo}
      alt={config.name}
      width={config.width ?? 120}
      height={config.height ?? 36}
      className={`block object-contain object-left ${logoClass} ${filter} ${className}`}
    />
  );
}
