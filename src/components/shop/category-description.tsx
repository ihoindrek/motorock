"use client";

import { Minus, Plus } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

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
  const [hasOverflow, setHasOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) {
      return;
    }

    const measure = () => {
      setHasOverflow((current) => {
        const next = el.scrollHeight > el.clientHeight + 1;
        return current === next ? current : next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text, expanded]);

  const showToggle = hasOverflow || expanded;

  return (
    <div className={cn("mt-3 lg:mt-0 lg:justify-self-stretch lg:pb-1", className)}>
      <div
        ref={textRef}
        className={cn(
          "text-base leading-relaxed text-ink/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-accent [&_p]:mb-0 [&_strong]:font-semibold [&_strong]:text-ink",
          !expanded && "line-clamp-3",
        )}
        {...(looksLikeHtml(text)
          ? { dangerouslySetInnerHTML: { __html: text } }
          : { children: text })}
      />
      {showToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          className="mt-1.5 inline-flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40 transition-colors hover:text-accent"
        >
          {expanded ? (
            <Minus className="size-3" strokeWidth={2.5} aria-hidden />
          ) : (
            <Plus className="size-3" strokeWidth={2.5} aria-hidden />
          )}
          {expanded ? dict.catalog.readLess : dict.catalog.readMore}
        </button>
      ) : null}
    </div>
  );
}
