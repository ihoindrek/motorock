"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import {
  HEADER_SEARCH_LIMIT,
  type ProductSearchResult,
} from "@/lib/graphql/search";
import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";

type HeaderSearchProps = {
  inverted?: boolean;
};

type SearchState = "idle" | "loading" | "ready" | "error";

const QUICK_BROWSE = [
  {
    href: "/shop/motorcycles",
    label: "Motorcycles",
    tag: "Ride",
    image: "/brixton-image.webp",
  },
  {
    href: "/shop/equipment",
    label: "Equipment",
    tag: "Gear",
    image: "/JRH10015_L23.webp",
  },
  {
    href: "/shop/tools",
    label: "Tools",
    tag: "Maintain",
    image: "/makita-tools.jpg",
  },
] as const;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }

  const match = text.match(new RegExp(`(${escapeRegExp(query.trim())})`, "i"));

  if (!match || match.index === undefined) {
    return text;
  }

  const start = match.index;
  const end = start + match[0].length;

  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-accent/35 text-paper">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function SearchPreview({
  result,
  query,
}: {
  result: ProductSearchResult | null;
  query: string;
}) {
  if (!result) {
    return (
      <div className="relative flex aspect-[4/5] min-h-[18rem] items-end overflow-hidden rounded-sm border border-paper/10 bg-paper/5 lg:min-h-[24rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_90_0_/_0.18),transparent_55%)]" />
        <div className="relative z-[1] p-6">
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
            Preview
          </p>
          <p className="mt-2 max-w-xs font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-paper/70">
            Start typing to explore the catalog
          </p>
        </div>
      </div>
    );
  }

  const isMotorcycle = result.type === "motorcycle";

  return (
    <Link
      href={`/shop/product/${result.slug}`}
      className="group flex min-h-[18rem] flex-col overflow-hidden rounded-sm border border-paper/10 bg-paper/5 lg:min-h-[24rem]"
    >
      <div
        className={cn(
          "relative w-full shrink-0 bg-moto",
          isMotorcycle ? "aspect-[4/3]" : "aspect-[4/5]",
        )}
      >
        <Image
          src={result.image}
          alt={result.name}
          fill
          sizes="(max-width: 1024px) 100vw, 360px"
          className={cn(
            "transition-transform duration-700 ease-out",
            isMotorcycle
              ? "object-contain object-center p-4 mix-blend-multiply group-hover:scale-[1.03]"
              : "object-cover object-center group-hover:scale-[1.04]",
          )}
          priority
        />
        {!isMotorcycle ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent"
            aria-hidden="true"
          />
        ) : null}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgb(120_120_120_/_0.35),transparent_72%)]"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col border-t border-paper/10 p-5">
        <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
          {result.brand}
        </p>
        <p className="mt-2 font-display text-xl font-extrabold uppercase leading-tight tracking-tight text-paper sm:text-2xl">
          {highlightMatch(result.name, query)}
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/55">
            {result.categoryLabel}
          </p>
          <p className="font-display text-lg font-bold tabular-nums text-paper">
            {formatPrice(result.price)}
          </p>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/80 transition-colors group-hover:text-accent">
          View product
          <ArrowIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function SearchResultRow({
  result,
  query,
  active,
  index,
  onSelect,
  onHover,
}: {
  result: ProductSearchResult;
  query: string;
  active: boolean;
  index: number;
  onSelect: () => void;
  onHover: () => void;
}) {
  const isMotorcycle = result.type === "motorcycle";

  return (
    <Link
      href={`/shop/product/${result.slug}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onTouchStart={onHover}
      style={{ animationDelay: `${index * 55}ms` }}
      className={cn(
        "group animate-mega-menu-item flex items-center gap-4 border border-transparent px-3 py-3 transition-[border-color,background-color,transform] duration-200 sm:px-4",
        active
          ? "border-accent/60 bg-accent/10"
          : "hover:border-paper/15 hover:bg-paper/5",
      )}
    >
      <div
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-sm bg-moto sm:size-[4.5rem]",
          active && "ring-2 ring-accent/80 ring-offset-2 ring-offset-ink",
        )}
      >
        <Image
          src={result.image}
          alt=""
          fill
          sizes="72px"
          className={cn(
            "transition-transform duration-500",
            isMotorcycle
              ? "object-contain object-center p-1.5 mix-blend-multiply group-hover:scale-105"
              : "object-cover object-center group-hover:scale-110",
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent/80">
          {result.brand}
        </p>
        <p className="truncate font-body text-sm leading-snug text-paper sm:text-base">
          {highlightMatch(result.name, query)}
        </p>
        <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/40">
          {result.categoryLabel}
          {!result.inStock ? (
            <span className="ml-2 text-paper/55">· Sold out</span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-display text-sm font-bold tabular-nums text-paper">
          {formatPrice(result.price)}
        </p>
        <ArrowIcon
          className={cn(
            "size-4 text-paper/30 transition-all duration-200",
            active && "translate-x-0.5 text-accent",
            "group-hover:translate-x-0.5 group-hover:text-accent",
          )}
        />
      </div>
    </Link>
  );
}

function QuickBrowseCard({
  href,
  label,
  tag,
  image,
  onSelect,
  index,
}: {
  href: string;
  label: string;
  tag: string;
  image: string;
  onSelect: () => void;
  index: number;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      style={{ animationDelay: `${120 + index * 90}ms` }}
      className="group animate-mega-menu-item relative aspect-[4/3] overflow-hidden rounded-sm border border-paper/10"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_100%,rgb(120_120_120_/_0.4),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 z-[1] p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-accent">
          {tag}
        </p>
        <p className="mt-1 font-display text-lg font-extrabold uppercase leading-none tracking-tight text-paper">
          {label}
        </p>
      </div>
    </Link>
  );
}

export function HeaderSearch({ inverted = false }: HeaderSearchProps) {
  const dialogId = useId();
  const inputId = `${dialogId}-input`;
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [hasMore, setHasMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setState("idle");
    setHasMore(false);
    setActiveIndex(-1);
    abortRef.current?.abort();
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const viewport = window.visualViewport;
    const syncKeyboardInset = () => {
      if (!viewport) {
        return;
      }

      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      document.documentElement.style.setProperty(
        "--search-kb-inset",
        `${inset}px`,
      );
    };

    viewport?.addEventListener("resize", syncKeyboardInset);
    viewport?.addEventListener("scroll", syncKeyboardInset);
    syncKeyboardInset();

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener("resize", syncKeyboardInset);
      viewport?.removeEventListener("scroll", syncKeyboardInset);
      document.documentElement.style.removeProperty("--search-kb-inset");
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    abortRef.current?.abort();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setState("idle");
      setHasMore(false);
      setActiveIndex(-1);
      return;
    }

    setState("loading");

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=${HEADER_SEARCH_LIMIT}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as {
          results: ProductSearchResult[];
          hasMore: boolean;
        };

        setResults(payload.results);
        setHasMore(payload.hasMore);
        setState("ready");
        setActiveIndex(payload.results.length > 0 ? 0 : -1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
        setHasMore(false);
        setState("error");
        setActiveIndex(-1);
      }
    }, 280);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? -1 : Math.min(index + 1, results.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? -1 : Math.max(index - 1, 0),
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      window.location.href = `/shop/product/${results[activeIndex].slug}`;
      close();
    }
  };

  const trimmedQuery = query.trim();
  const showQuickBrowse = trimmedQuery.length < 2;
  const previewResult =
    activeIndex >= 0 ? (results[activeIndex] ?? null) : (results[0] ?? null);

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className={cn(
          "group relative inline-flex size-11 items-center justify-center transition-colors hover:text-accent sm:size-10",
          inverted ? "text-paper" : "text-ink",
        )}
      >
        <span className="sr-only">Open search</span>
        <SearchIcon className="size-5 transition-transform duration-200 group-hover:scale-110" />
      </button>

      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-label`}
          className="fixed inset-0 z-[130] flex h-[100dvh] flex-col overflow-hidden animate-search-in bg-ink pb-[var(--search-kb-inset,0px)] pt-[env(safe-area-inset-top)]"
        >
          <GrainOverlay variant="dark" emphasis className="opacity-100" />

          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 z-[1]"
            onClick={close}
          />

          <div className="relative z-[2] flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="site-container shrink-0 flex items-center justify-end py-4 sm:py-6">
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-11 items-center gap-2 px-1 font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/50 transition-colors hover:text-accent"
              >
                Close
                <kbd className="hidden rounded-sm border border-paper/15 px-1.5 py-0.5 text-paper/35 sm:inline">
                  Esc
                </kbd>
              </button>
            </div>

            <div className="site-container shrink-0 pb-6 sm:pb-8">
              <label htmlFor={inputId} id={`${dialogId}-label`} className="sr-only">
                Search products
              </label>
              <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-paper sm:text-3xl lg:text-4xl">
                Find your next ride
              </h2>

              <div className="relative mt-6 sm:mt-8">
                <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px overflow-hidden">
                  <div
                    className={cn(
                      "h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent",
                      state === "loading" && "animate-search-scan",
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center gap-4 border-b border-paper/15 pb-4 sm:gap-5 sm:pb-5">
                  <SearchIcon className="size-6 shrink-0 text-accent sm:size-8" />
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Helmet, Brixton, gloves…"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent font-display text-2xl font-bold uppercase tracking-tight text-paper outline-none placeholder:text-paper/20 sm:text-4xl"
                  />
                  <kbd className="hidden shrink-0 rounded-sm border border-paper/15 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/35 md:inline">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            <div className="site-container min-h-0 flex-1 overflow-hidden">
              <div className="grid h-full min-h-0 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-10">
                <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8 [-ms-overflow-style:none] [scrollbar-width:none] sm:pb-12 lg:pr-1 [&::-webkit-scrollbar]:hidden">
                  {showQuickBrowse ? (
                    <div>
                      <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/40">
                        Browse the shop
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {QUICK_BROWSE.map((item, index) => (
                          <QuickBrowseCard
                            key={item.href}
                            {...item}
                            index={index}
                            onSelect={close}
                          />
                        ))}
                      </div>
                      <p className="mt-6 font-body text-sm text-paper/45">
                        Type at least 2 characters — results update live.
                      </p>
                    </div>
                  ) : null}

                  {state === "loading" ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex animate-pulse items-center gap-4 border border-paper/5 px-3 py-3 sm:px-4"
                        >
                          <div className="size-16 rounded-sm bg-paper/10 sm:size-[4.5rem]" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2 w-14 rounded-sm bg-paper/10" />
                            <div className="h-3 w-4/5 rounded-sm bg-paper/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {state === "error" ? (
                    <p className="py-8 font-body text-sm text-paper/60">
                      Search is temporarily unavailable. Try again in a moment.
                    </p>
                  ) : null}

                  {state === "ready" && results.length === 0 ? (
                    <p className="py-8 font-body text-sm text-paper/60">
                      Nothing matched &ldquo;{trimmedQuery}&rdquo;. Try another
                      keyword or browse the categories.
                    </p>
                  ) : null}

                  {results.length > 0 ? (
                    <div className="space-y-1">
                      <p
                        className="mb-3 font-display text-[10px] font-bold uppercase tracking-aggressive text-paper/40"
                        aria-live="polite"
                      >
                        {hasMore
                          ? `${HEADER_SEARCH_LIMIT}+ matches`
                          : `${results.length} match${results.length === 1 ? "" : "es"}`}
                      </p>
                      {results.map((result, index) => (
                        <SearchResultRow
                          key={result.slug}
                          result={result}
                          query={trimmedQuery}
                          active={index === activeIndex}
                          index={index}
                          onSelect={close}
                          onHover={() => setActiveIndex(index)}
                        />
                      ))}
                      {hasMore ? (
                        <div className="border-t border-paper/10 pt-4">
                          <Link
                            href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                            onClick={close}
                            className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-aggressive text-paper/70 transition-colors hover:text-accent"
                          >
                            View more
                            <ArrowIcon className="size-3.5" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-8 h-12 bg-gradient-to-t from-ink to-transparent"
                    aria-hidden="true"
                  />
                </div>

                <div className="hidden min-h-0 lg:block">
                  <div className="lg:sticky lg:top-0">
                    <SearchPreview
                      result={showQuickBrowse ? null : previewResult}
                      query={trimmedQuery}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="site-container shrink-0 border-t border-paper/10 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="font-body text-[11px] text-paper/35">
                {state === "loading"
                  ? "Scanning catalog…"
                  : results.length > 0
                    ? (
                        <>
                          <span className="sm:hidden">Tap a result to open</span>
                          <span className="hidden sm:inline">
                            Use ↑ ↓ to browse, Enter to open
                          </span>
                        </>
                      )
                    : "Motorcycles · Equipment · Tools"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
