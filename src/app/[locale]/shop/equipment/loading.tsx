function HubSkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-paper/10 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function EquipmentHubLoading() {
  return (
    <div
      className="bg-ink"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <div className="relative min-h-[52svh] sm:min-h-[58svh] lg:min-h-[62svh]">
        <HubSkeletonBar className="absolute inset-0" />
        <div className="site-container relative z-10 flex min-h-[52svh] flex-col justify-end pb-10 pt-28 sm:min-h-[58svh] sm:pb-12 lg:min-h-[62svh] lg:pb-16">
          <HubSkeletonBar className="mb-8 h-3 w-24" />
          <HubSkeletonBar className="h-3 w-12" />
          <HubSkeletonBar className="mt-3 h-16 w-72 max-w-full sm:h-20" />
          <HubSkeletonBar className="mt-4 h-4 w-full max-w-md" />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="site-container grid grid-cols-12 gap-10 py-16 xl:py-20">
          <div className="col-span-5 space-y-4 xl:col-span-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <HubSkeletonBar key={index} className="h-14 w-full" />
            ))}
          </div>
          <HubSkeletonBar className="col-span-7 min-h-[38rem] xl:col-span-8" />
        </div>
      </div>

      <div className="flex flex-col lg:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <HubSkeletonBar key={index} className="min-h-[46svh] w-full" />
        ))}
      </div>
    </div>
  );
}
