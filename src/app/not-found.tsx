import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">404</p>
      <h1 className="heading-category mt-3 text-3xl sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        This page does not exist or has moved. Try the shop or search instead.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop/equipment" className="btn-accent">
          Shop equipment
        </Link>
        <Link href="/search" className="btn-ghost">
          Search
        </Link>
      </div>
    </div>
  );
}
