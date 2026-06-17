import type { ReactNode } from "react";
import type { ProductSpec } from "@/types/catalog-product";

const specIcons: Record<string, ReactNode> = {
  cc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  power: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  weight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M12 3v18M6 8h12M8 21h8" />
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M4 18h16M7 18V9a5 5 0 0110 0v9" />
    </svg>
  ),
  ce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4z" />
    </svg>
  ),
  material: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M4 6h16v12H4zM8 6V4h8v2" />
    </svg>
  ),
  cert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
      <path d="M9 12l2 2 4-4M7 3h10v4l-5 3-5-3V3zM5 21h14l-7-4-7 4z" />
    </svg>
  ),
};

function SpecIcon({ id }: { id: string }) {
  return (
    <span className="text-accent">
      {specIcons[id] ?? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )}
    </span>
  );
}

export function ProductSpecs({
  specs,
  theme = "light",
}: {
  specs: readonly ProductSpec[];
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {specs.map((spec) => (
        <li
          key={spec.id}
          className={
            isDark
              ? "border border-paper/10 bg-paper/5 px-4 py-5 sm:px-5 sm:py-6"
              : "border border-ink/10 bg-surface/60 px-4 py-4"
          }
        >
          <SpecIcon id={spec.id} />
          <p
            className={`mt-3 font-body text-[10px] font-bold uppercase tracking-aggressive ${
              isDark ? "text-paper/40" : "text-ink/50"
            }`}
          >
            {spec.label}
          </p>
          <p
            className={`mt-1 text-sm font-bold sm:text-base ${
              isDark ? "text-paper" : "text-ink"
            }`}
          >
            {spec.value}
          </p>
        </li>
      ))}
    </ul>
  );
}
