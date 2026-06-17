type CategoryViewSkeletonProps = {
  productCount?: number;
};

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-ink/10 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function CategoryViewSkeleton({
  productCount = 12,
}: CategoryViewSkeletonProps) {
  return (
    <div
      className="site-container relative z-10 py-8 lg:py-12"
      aria-busy="true"
      aria-label="Loading products"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SkeletonBar className="h-3 w-10" />
        <SkeletonBar className="h-3 w-3" />
        <SkeletonBar className="h-3 w-28" />
      </div>

      <header className="mb-8 max-w-2xl">
        <SkeletonBar className="h-3 w-12" />
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <SkeletonBar className="h-10 w-56 max-w-full sm:h-12" />
          <SkeletonBar className="h-4 w-24" />
        </div>
        <SkeletonBar className="mt-4 h-4 w-full max-w-lg" />
        <SkeletonBar className="mt-2 h-4 w-[80%] max-w-md" />
      </header>

      <div className="mb-6 flex items-center justify-end gap-3 lg:hidden">
        <SkeletonBar className="h-12 w-28" />
        <SkeletonBar className="h-12 w-36" />
      </div>

      <div className="mb-6 hidden lg:flex lg:items-center lg:gap-4 lg:border-b lg:border-ink/10 lg:pb-5">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBar key={index} className="h-10 w-24" />
          ))}
        </div>
        <SkeletonBar className="h-12 w-36 shrink-0" />
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
        {Array.from({ length: productCount }).map((_, index) => (
          <li key={index} className="flex flex-col">
            <SkeletonBar className="aspect-[4/5] w-full rounded-sm" />
            <SkeletonBar className="mt-3 h-3 w-16" />
            <SkeletonBar className="mt-2 h-4 w-full" />
            <SkeletonBar className="mt-2 h-4 w-20" />
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-center gap-3">
        <SkeletonBar className="h-4 w-40" />
        <SkeletonBar className="h-12 w-44" />
      </div>
    </div>
  );
}
