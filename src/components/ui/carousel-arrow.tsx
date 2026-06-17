"use client";

export type CarouselArrowTheme = "light" | "dark";

type CarouselArrowProps = {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  theme?: CarouselArrowTheme;
  variant?: "full" | "icon";
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  className?: string;
};

export function CarouselArrow({
  direction,
  label,
  onClick,
  theme = "light",
  variant = "full",
  orientation = "horizontal",
  disabled = false,
  className = "",
}: CarouselArrowProps) {
  const isPrev = direction === "prev";
  const isLight = theme === "light";
  const isIcon = variant === "icon";
  const isVertical = orientation === "vertical";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`group/arrow flex items-center transition-all duration-300 disabled:pointer-events-none disabled:opacity-20 ${
        isVertical
          ? `flex-col gap-1 ${isPrev ? "" : "flex-col-reverse"}`
          : `gap-3 sm:gap-4 ${isPrev ? "flex-row" : "flex-row-reverse"}`
      } ${isIcon ? "shrink-0 justify-center" : ""} ${className}`}
    >
      {!isIcon ? (
        <span
          className={`font-body text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover/arrow:text-accent ${
            isLight ? "text-ink/40" : "text-paper/40"
          }`}
        >
          {isPrev ? "Previous" : "Next"}
        </span>
      ) : null}

      {isVertical ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 160"
          fill="none"
          aria-hidden="true"
          className={`transition-all duration-500 group-hover/arrow:text-accent ${
            isIcon ? "h-10 w-5 sm:h-11 sm:w-6" : "h-16 w-4 sm:h-20 sm:w-5"
          } ${isLight ? "text-ink" : "text-paper"}`}
        >
          {isPrev ? (
            <>
              <path
                d="M12 148V28"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <path
                d="M12 28L2 44M12 28L22 44"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <circle
                cx="12"
                cy="8"
                r="2"
                fill="currentColor"
                className="opacity-0 transition-opacity duration-300 group-hover/arrow:opacity-100"
              />
            </>
          ) : (
            <>
              <path
                d="M12 12V132"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <path
                d="M12 132L2 116M12 132L22 116"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <circle
                cx="12"
                cy="152"
                r="2"
                fill="currentColor"
                className="opacity-0 transition-opacity duration-300 group-hover/arrow:opacity-100"
              />
            </>
          )}
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 160 24"
          fill="none"
          aria-hidden="true"
          className={`transition-all duration-500 group-hover/arrow:text-accent ${
            isIcon
              ? "h-3.5 w-12 sm:h-4 sm:w-14"
              : "h-4 w-20 group-hover/arrow:w-28 sm:h-5 sm:w-28 sm:group-hover/arrow:w-36 lg:w-36 lg:group-hover/arrow:w-44"
          } ${isLight ? "text-ink" : "text-paper"} ${
            !isIcon
              ? isPrev
                ? "-translate-x-1 group-hover/arrow:-translate-x-2"
                : "translate-x-1 group-hover/arrow:translate-x-2"
              : ""
          }`}
        >
          {isPrev ? (
            <>
              <path
                d="M148 12H28"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <path
                d="M28 12L44 2M28 12L44 22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <circle
                cx="8"
                cy="12"
                r="2"
                fill="currentColor"
                className="opacity-0 transition-opacity duration-300 group-hover/arrow:opacity-100"
              />
            </>
          ) : (
            <>
              <path
                d="M12 12H132"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <path
                d="M132 12L116 2M132 12L116 22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="transition-all duration-500 group-hover/arrow:stroke-[2]"
              />
              <circle
                cx="152"
                cy="12"
                r="2"
                fill="currentColor"
                className="opacity-0 transition-opacity duration-300 group-hover/arrow:opacity-100"
              />
            </>
          )}
        </svg>
      )}
    </button>
  );
}
