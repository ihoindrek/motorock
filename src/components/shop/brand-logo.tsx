type BrandLogoProps = {
  brand: string;
  size?: "sm" | "lg";
  className?: string;
};

export function BrandLogo({
  brand,
  size = "sm",
  className = "",
}: BrandLogoProps) {
  return (
    <p
      className={`font-body font-bold uppercase tracking-aggressive text-accent ${
        size === "lg" ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
      } ${className}`}
    >
      {brand}
    </p>
  );
}
