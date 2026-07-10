type ProductPageLoadingProps = {
  ariaLabel: string;
};

export function ProductPageLoading({ ariaLabel }: ProductPageLoadingProps) {
  return (
    <div
      aria-busy="true"
      aria-label={ariaLabel}
      className="bg-paper"
    >
      <section className="bg-moto">
        <div className="site-container py-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="aspect-[4/3] animate-pulse bg-ink/5 lg:col-span-7" />
            <div className="space-y-4 lg:col-span-5">
              <div className="h-4 w-24 animate-pulse bg-ink/10" />
              <div className="h-10 w-3/4 animate-pulse bg-ink/10" />
              <div className="h-6 w-32 animate-pulse bg-ink/10" />
              <div className="h-20 w-full animate-pulse bg-ink/5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
