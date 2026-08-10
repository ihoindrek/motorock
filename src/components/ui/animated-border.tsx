"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { StarBackground } from "@/components/ui/star-button";
import { cn } from "@/lib/utils";

type AnimatedBorderProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  lightWidth?: number;
  duration?: number;
  lightColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
};

export function AnimatedBorder({
  children,
  className,
  contentClassName,
  lightWidth = 110,
  duration = 3,
  lightColor = "#FF6813",
  backgroundColor = "#FAF8F6",
  borderWidth = 2,
}: AnimatedBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updatePath = () => {
      node.style.setProperty(
        "--path",
        `path('M 0 0 H ${node.offsetWidth} V ${node.offsetHeight} H 0 V 0')`,
      );
    };

    updatePath();

    const observer = new ResizeObserver(updatePath);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={
        {
          "--duration": duration,
          "--light-width": `${lightWidth}px`,
          "--light-color": lightColor,
          "--border-width": `${borderWidth}px`,
          isolation: "isolate",
        } as CSSProperties
      }
      className={cn("relative overflow-hidden rounded-sm", className)}
    >
      <div
        className="animate-star-btn pointer-events-none absolute inset-0 aspect-square bg-[radial-gradient(ellipse_at_center,var(--light-color),transparent,transparent)]"
        style={
          {
            offsetPath: "var(--path)",
            offsetDistance: "0%",
            width: "var(--light-width)",
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit] border-ink/10"
        style={{ borderWidth: "var(--border-width)" }}
        aria-hidden="true"
      >
        <StarBackground color={backgroundColor} />
      </div>
      <div className={cn("relative z-[2]", contentClassName)}>{children}</div>
    </div>
  );
}
