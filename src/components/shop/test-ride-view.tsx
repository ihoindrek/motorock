"use client";

import Link from "next/link";
import { EditorialHero } from "@/components/content/editorial-hero";
import { TestRideForm, type TestRideInitialValues } from "@/components/shop/test-ride-form";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
} from "@/data/showroom";

export type { TestRideInitialValues };

export function TestRideView({ initial }: { initial: TestRideInitialValues }) {
  return (
    <>
      <EditorialHero
        eyebrow="Test ride"
        title="Book a"
        accent="test ride."
        description="Pick a time, we'll have the bike ready. Most riders decide in the saddle — we'll take care of the rest."
      />

      <section className="bg-moto py-16 lg:py-24">
        <div className="site-container lg:grid lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="text-xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-2xl">
              Showroom
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              {SHOWROOM.name}
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
              Open in Google Maps →
            </a>
            <p className="mt-10 text-sm leading-relaxed text-ink/55">
              We&apos;ll confirm your slot by email — usually within one business
              day. Bring your licence and gear if you want to ride.
            </p>
          </div>

          <div className="mt-12 border border-ink/15 bg-paper p-6 sm:p-8 lg:col-span-7 lg:mt-0 lg:p-10">
            <TestRideForm initial={initial} />
            <p className="mt-8 text-sm text-ink/45 lg:hidden">
              Prefer browsing first?{" "}
              <Link href="/shop/motorcycles" className="text-ink underline-offset-2 hover:text-accent hover:underline">
                See all motorcycles
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
