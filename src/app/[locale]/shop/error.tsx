"use client";

import Link from "next/link";

export default function ShopError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow text-accent">Shop unavailable</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        Could not load products
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        Our catalog could not be reached right now. Check your connection and
        try again, or browse another section.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => unstable_retry()} className="btn-accent">
          Try again
        </button>
        <Link href="/shop/equipment" className="btn-ghost">
          Equipment hub
        </Link>
        <Link href="/" className="btn-ghost">
          Home
        </Link>
      </div>
    </div>
  );
}
