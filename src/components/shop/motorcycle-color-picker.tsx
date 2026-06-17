import type { ProductColorOption } from "@/types/catalog-product";

type MotorcycleColorPickerProps = {
  options: readonly ProductColorOption[];
  value: string;
  onChange: (color: string) => void;
  heading?: string;
  theme?: "light" | "dark";
  variant?: "detailed" | "compact";
};

function optionValue(option: ProductColorOption) {
  return option.value ?? option.label;
}

export function MotorcycleColorPicker({
  options,
  value,
  onChange,
  heading = "Finish",
  theme = "light",
  variant = "detailed",
}: MotorcycleColorPickerProps) {
  const isDark = theme === "dark";
  const isCompact = variant === "compact";

  return (
    <div>
      <p
        className={`font-display text-[10px] font-bold uppercase tracking-aggressive ${
          isDark ? "text-paper/40" : "text-ink/50"
        }`}
      >
        {heading}
        {isCompact && value ? (
          <span
            className={`normal-case tracking-normal ${
              isDark ? "text-paper/70" : "text-ink/60"
            }`}
          >
            {" "}
            ·{" "}
            {options.find((option) => optionValue(option) === value)?.label ??
              value}
          </span>
        ) : null}
      </p>
      <ul
        className={`flex flex-wrap gap-2 ${isCompact ? "mt-2.5" : "mt-3"}`}
        aria-label="Available finishes"
      >
        {options.map((option) => {
          const optionKey = optionValue(option);
          const selected = value === optionKey;

          if (isCompact) {
            return (
              <li key={optionKey}>
                <button
                  type="button"
                  onClick={() => onChange(optionKey)}
                  aria-pressed={selected}
                  aria-label={option.label}
                  title={option.label}
                  className={`rounded-full border-2 p-0.5 transition-all duration-200 ${
                    selected
                      ? "border-accent"
                      : isDark
                        ? "border-transparent hover:border-paper/30"
                        : "border-transparent hover:border-ink/20"
                  }`}
                >
                  <span
                    className="block size-7 rounded-full border border-ink/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] sm:size-8"
                    style={{
                      backgroundColor: option.hex ?? "#C5C5C5",
                    }}
                  />
                </button>
              </li>
            );
          }

          return (
            <li key={optionKey}>
              <button
                type="button"
                onClick={() => onChange(optionKey)}
                aria-pressed={selected}
                className={`group flex items-center gap-2.5 border px-3 py-2 transition-all duration-200 ${
                  selected
                    ? "border-accent bg-accent/10"
                    : isDark
                      ? "border-paper/15 hover:border-paper/35"
                      : "border-ink/15 hover:border-ink/30"
                }`}
              >
                <span
                  className={`size-5 shrink-0 rounded-full border ${
                    selected
                      ? "border-accent"
                      : isDark
                        ? "border-paper/25"
                        : "border-ink/20"
                  }`}
                  style={{
                    backgroundColor: option.hex ?? "#c5c5c5",
                  }}
                  aria-hidden="true"
                />
                <span
                  className={`text-sm ${isDark ? "text-paper" : "text-ink"}`}
                >
                  {option.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
