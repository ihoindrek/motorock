type GrainOverlayProps = {
  variant?: "light" | "dark";
  /** Hero banners: grain that fades out on parent `.group` hover. */
  hero?: boolean;
  /** Hero: grain visible at bottom, dissolves toward the top. */
  fadeUp?: boolean;
  /** Extra-soft grain for dark editorial sections. */
  subtle?: boolean;
  /** Stronger film grain on dark editorial headers (e.g. Rebel on two wheels). */
  emphasis?: boolean;
  /** Soft film grain tuned for bg-moto light gray surfaces. */
  moto?: boolean;
  /** Film grain tuned for site footer on bg-ink. */
  footer?: boolean;
  className?: string;
};

function resolveGrainClass({
  variant,
  hero,
  fadeUp,
  subtle,
  emphasis,
  moto,
  footer,
}: Pick<
  GrainOverlayProps,
  "variant" | "hero" | "fadeUp" | "subtle" | "emphasis" | "moto" | "footer"
>) {
  const classes = ["grain-overlay"];

  if (hero) {
    classes.push("grain-overlay--hero");
    if (fadeUp) {
      classes.push("grain-overlay--hero-fade-up");
    }
    return classes;
  }

  if (footer && variant === "dark") {
    classes.push("grain-overlay--footer");
  } else if (moto && variant === "light") {
    classes.push("grain-overlay--light-moto");
  } else if (emphasis && variant === "dark") {
    classes.push("grain-overlay--dark-emphasis");
  } else if (subtle && variant === "dark") {
    classes.push("grain-overlay--dark-subtle");
  } else if (subtle && variant === "light") {
    classes.push("grain-overlay--light-subtle");
  } else {
    classes.push(`grain-overlay--${variant}`);
  }

  return classes;
}

export function GrainOverlay({
  variant = "light",
  hero = false,
  fadeUp = false,
  subtle = false,
  emphasis = false,
  moto = false,
  footer = false,
  className = "",
}: GrainOverlayProps) {
  const classes = resolveGrainClass({
    variant,
    hero,
    fadeUp,
    subtle,
    emphasis,
    moto,
    footer,
  });

  return (
    <div
      aria-hidden="true"
      className={`${classes.join(" ")} ${className}`.trim()}
    />
  );
}
