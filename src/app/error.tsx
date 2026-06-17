"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">Something went wrong</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        We hit a bump
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        The page could not load properly. Try again, or head back to the shop.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => unstable_retry()} className="btn-accent">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
