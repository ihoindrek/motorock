"use client";

import { Minus, Plus } from "lucide-react";
import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";
import { useLayoutEffect, useRef, useState } from "react";

const COLLAPSED_LINES = 3;

type CategoryDescriptionProps = {
  text: string;
  className?: string;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function CategoryDescription({
  text,
  className = "",
}: CategoryDescriptionProps) {
  const dict = useDictionary();
  const textRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const isHtml = looksLikeHtml(text);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      const styles = getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const nextCollapsed = Number.isFinite(lineHeight)
        ? lineHeight * COLLAPSED_LINES
        : el.clientHeight;
      const nextFull = el.scrollHeight;

      setCollapsedHeight(nextCollapsed);
      setFullHeight(nextFull);
      setOverflows(nextFull > nextCollapsed + 1);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const measured = collapsedHeight != null && fullHeight != null;
  const maxHeight = !measured
    ? undefined
    : !overflows || expanded
      ? fullHeight
      : collapsedHeight;

  return (
    <div className={cn("mt-3 lg:mt-0 lg:justify-self-stretch lg:pb-1", className)}>
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-300 ease-out",
          !measured && "line-clamp-3",
        )}
        style={maxHeight != null ? { maxHeight } : undefined}
      >
        <div
          ref={textRef}
          className="text-base leading-relaxed text-ink/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-accent [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-ink"
          {...(isHtml
            ? { dangerouslySetInnerHTML: { __html: text } }
            : { children: text })}
        />
      </div>

      {overflows ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="mt-1.5 inline-flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40 transition-colors hover:text-accent"
        >
          {expanded ? (
            <Minus className="size-3" strokeWidth={2.5} aria-hidden />
          ) : (
            <Plus className="size-3" strokeWidth={2.5} aria-hidden />
          )}
          {expanded ? dict.pdp.readLess : dict.pdp.readMore}
        </button>
      ) : null}
    </div>
  );
}
