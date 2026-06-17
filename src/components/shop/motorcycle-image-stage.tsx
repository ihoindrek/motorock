import Image from "next/image";

type MotorcycleImageStageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  aspectClass?: string;
  variant?: "product" | "scene";
  framed?: boolean;
  /** Blends into parent bg-moto — no extra fill, ring, vignette, or multiply. */
  seamless?: boolean;
  theme?: "dark" | "light";
};

export function MotorcycleImageStage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  className = "",
  aspectClass = "aspect-[4/3]",
  variant = "product",
  framed = false,
  seamless = false,
  theme = "light",
}: MotorcycleImageStageProps) {
  const isProduct = variant === "product";
  const showFrame = framed && !seamless;

  return (
    <figure
      className={`relative ${aspectClass} w-full overflow-hidden ${
        seamless
          ? "bg-transparent"
          : isProduct
            ? "bg-moto"
            : theme === "dark"
              ? "bg-ink"
              : "bg-surface"
      } ${
        showFrame
          ? theme === "dark"
            ? "ring-1 ring-inset ring-paper/10"
            : "ring-1 ring-inset ring-ink/8"
          : ""
      } ${className}`}
    >
      {showFrame ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(11_11_11/0.06)_100%)]"
          aria-hidden="true"
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={
          isProduct
            ? `object-contain object-center transition-transform duration-500 group-hover/openable:scale-[1.02] ${
                seamless
                  ? "p-[4%] sm:p-[5%]"
                  : "p-[7%] mix-blend-multiply sm:p-[9%] lg:p-[10%]"
              }`
            : "object-cover object-center transition-transform duration-500 group-hover/openable:scale-[1.02]"
        }
      />
    </figure>
  );
}
