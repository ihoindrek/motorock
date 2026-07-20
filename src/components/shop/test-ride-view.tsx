"use client";

import { useEffect, useState } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { EditorialHero } from "@/components/content/editorial-hero";
import { TestRideForm, type TestRideInitialValues } from "@/components/shop/test-ride-form";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
  getShowroomCopy,
} from "@/data/showroom";

export type { TestRideInitialValues };

export function TestRideView() {
  const dict = useDictionary();
  const locale = useLocale();
  const showroom = getShowroomCopy(locale);
  // Read prefill from the query string after mount; the page is statically
  // prerendered, so the server never sees search params.
  const [initial, setInitial] = useState<TestRideInitialValues>({});

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const value = (key: string) => query.get(key)?.trim() || undefined;
    setInitial({
      slug: value("slug"),
      bike: value("bike"),
      brand: value("brand"),
      color: value("color"),
    });
  }, []);

  return (
    <>
      <EditorialHero
        eyebrow={dict.testRide.eyebrow}
        title={dict.testRide.title}
        accent={dict.testRide.accent}
        description={dict.testRide.description}
      />

      <section className="bg-moto py-16 lg:py-24">
        <div className="site-container lg:grid lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-3xl">
              {dict.testRide.showroom}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              {showroom.name}
              <br />
              {SHOWROOM.addressLine}
              <br />
              {SHOWROOM.city}
            </p>
            <a
              href={SHOWROOM_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:text-accent"
            >
              {dict.testRide.openMaps}
            </a>
            <p className="mt-10 text-sm leading-relaxed text-ink/55">
              {dict.testRide.confirmNote}
            </p>
          </div>

          <div className="mt-12 border border-ink/15 bg-paper p-6 sm:p-8 lg:col-span-7 lg:mt-0 lg:p-10">
            <h2 className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/45">
              {dict.testRide.formTitle}
            </h2>
            <div className="mt-6">
              <TestRideForm
                key={`${initial.slug ?? ""}|${initial.bike ?? ""}|${initial.brand ?? ""}|${initial.color ?? ""}`}
                initial={initial}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
