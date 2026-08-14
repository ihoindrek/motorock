"use client";

import Link from "next/link";
import { useEffect } from "react";

type MontonioPaymentReturnFallbackProps = {
  continueHref: string;
  locale: "en" | "et";
};

export function MontonioPaymentReturnFallback({
  continueHref,
  locale,
}: MontonioPaymentReturnFallbackProps) {
  const copy =
    locale === "et"
      ? {
          title: "Makse kinnitatud",
          description:
            "Suuname sind tellimuse kinnitusele. Kui suunamine ei alanud automaatselt, vajuta allolevat nuppu.",
          continue: "Jätka tellimuse juurde",
          home: "Avalehele",
        }
      : {
          title: "Payment confirmed",
          description:
            "We are redirecting you to your order confirmation. If nothing happens, use the button below.",
          continue: "Continue to order",
          home: "Home",
        };

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.httpEquiv = "refresh";
    meta.content = `0;url=${continueHref}`;
    document.head.appendChild(meta);

    window.location.replace(continueHref);

    return () => {
      meta.remove();
    };
  }, [continueHref]);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="section-eyebrow text-accent">{copy.title}</p>
      <h1 className="heading-category mt-3 text-3xl sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">{copy.description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={continueHref} className="btn-accent">
          {copy.continue}
        </a>
        <Link href={locale === "et" ? "/et" : "/en"} className="btn-ghost">
          {copy.home}
        </Link>
      </div>
    </div>
  );
}
