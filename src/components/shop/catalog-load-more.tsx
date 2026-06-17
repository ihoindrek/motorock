"use client";

import { useTransition } from "react";

type CatalogLoadMoreProps = {
  visibleCount: number;
  totalCount: number;
  pageSize: number;
  onLoadMore: () => void;
};

export function CatalogLoadMore({
  visibleCount,
  totalCount,
  pageSize,
  onLoadMore,
}: CatalogLoadMoreProps) {
  const [isPending, startTransition] = useTransition();

  const hasMore = visibleCount < totalCount;

  const loadMore = () => {
    if (!hasMore || isPending) {
      return;
    }

    startTransition(() => {
      onLoadMore();
    });
  };

  if (totalCount <= pageSize) {
    return null;
  }

  const progress = totalCount > 0 ? (visibleCount / totalCount) * 100 : 0;

  return (
    <div className="mt-12 flex flex-col items-center gap-5 sm:mt-14">
      <p className="text-center text-sm text-ink/60">
        Showing{" "}
        <span className="font-bold text-ink">{visibleCount}</span>
        {" / "}
        <span className="font-bold text-ink">{totalCount}</span> products
      </p>

      <div
        className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={visibleCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label="Products loaded"
      >
        <div
          className={`h-full rounded-full bg-ink transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isPending ? "opacity-80" : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={isPending}
          aria-busy={isPending}
          className="rounded-full border border-ink/20 bg-white px-8 py-3 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink transition-[color,border-color,opacity,transform] duration-300 hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-60 motion-safe:active:scale-[0.98]"
        >
          {isPending ? "Loading…" : "Load more products"}
        </button>
      ) : (
        <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
          All products loaded
        </p>
      )}
    </div>
  );
}
