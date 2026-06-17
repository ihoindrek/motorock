"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type VideoTextProps = {
  children: ReactNode;
  videoSrc: string;
  className?: string;
};

type TextMetrics = {
  width: number;
  height: number;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  displayLabel: string;
};

function textFromChildren(children: ReactNode) {
  if (typeof children === "string") {
    return children;
  }

  if (typeof children === "number") {
    return String(children);
  }

  return "";
}

function getDisplayLabel(label: string, textTransform: string) {
  switch (textTransform) {
    case "uppercase":
      return label.toUpperCase();
    case "lowercase":
      return label.toLowerCase();
    case "capitalize":
      return label.replace(/\b\w/g, (char) => char.toUpperCase());
    default:
      return label;
  }
}

function measureText(element: HTMLElement, label: string): TextMetrics | null {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  const style = getComputedStyle(element);
  const range = document.createRange();
  range.selectNodeContents(element);
  const textRect = range.getBoundingClientRect();

  if (textRect.width === 0 || textRect.height === 0) {
    return null;
  }

  return {
    width: rect.width,
    height: rect.height,
    x: textRect.left - rect.left,
    y: textRect.top - rect.top,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    displayLabel: getDisplayLabel(label, style.textTransform),
  };
}

export function VideoText({ children, videoSrc, className = "" }: VideoTextProps) {
  const clipId = useId().replace(/:/g, "");
  const sizerRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);
  const [showMotion, setShowMotion] = useState(false);

  const label = textFromChildren(children);

  const updateMetrics = useCallback(async () => {
    const element = sizerRef.current;
    if (!element || !label) {
      setMetrics(null);
      return;
    }

    await document.fonts.ready;
    setMetrics(measureText(element, label));
  }, [label]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShowMotion(!media.matches);

    const onChange = () => {
      setShowMotion(!media.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!showMotion) {
      return;
    }

    void updateMetrics();

    const element = sizerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      void updateMetrics();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [className, label, showMotion, updateMetrics]);

  useEffect(() => {
    if (!showMotion || !metrics) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    const play = () => {
      void video.play().catch(() => {});
    };

    video.addEventListener("canplay", play);
    if (video.readyState >= 2) {
      play();
    }

    return () => {
      video.removeEventListener("canplay", play);
    };
  }, [metrics, showMotion, videoSrc]);

  if (!showMotion) {
    return <span className={`text-paper ${className}`}>{children}</span>;
  }

  const clipReady = metrics !== null;

  return (
    <span className="rebel-text relative inline-block">
      <span className="sr-only">{children}</span>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        <defs>
          {metrics ? (
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <text
                x={metrics.x}
                y={metrics.y}
                dominantBaseline="hanging"
                fontFamily={metrics.fontFamily}
                fontSize={metrics.fontSize}
                fontWeight={metrics.fontWeight}
                letterSpacing={
                  metrics.letterSpacing === "normal"
                    ? undefined
                    : metrics.letterSpacing
                }
              >
                {metrics.displayLabel}
              </text>
            </clipPath>
          ) : null}
        </defs>
      </svg>

      <span
        ref={sizerRef}
        aria-hidden="true"
        className={`rebel-text__base block ${className} ${
          clipReady ? "text-transparent" : "text-paper"
        }`}
      >
        {children}
      </span>

      {metrics ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={videoSrc}
          aria-hidden="true"
          className="rebel-text__video pointer-events-none"
          style={{
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        />
      ) : null}

      <span
        aria-hidden="true"
        className={`rebel-text__shimmer pointer-events-none absolute inset-0 ${className}`}
      >
        {children}
      </span>
    </span>
  );
}
