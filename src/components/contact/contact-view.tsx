"use client";

import { useState, type FormEvent } from "react";
import { EditorialHero } from "@/components/content/editorial-hero";
import { ContactMap } from "@/components/contact/contact-map";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import {
  SHOWROOM_GOOGLE_MAPS_URL,
  SHOWROOM_WAZE_URL,
} from "@/data/showroom";

const contactParallaxImages = [
  { src: "/c1.webp", alt: "Motorock showroom" },
  { src: "/c2.webp", alt: "Motorock motorcycles" },
  { src: "/c3.webp", alt: "Motorock team" },
  { src: "/c4.webp", alt: "Motorock workshop" },
  { src: "/c5.webp", alt: "Motorock riding gear" },
  { src: "/c6.webp", alt: "Motorock bikes on display" },
  { src: "/c7.webp", alt: "Motorock lifestyle" },
] as const;

const fieldLabelClassName =
  "font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/40";

const fieldClassName =
  "w-full border-0 border-b border-ink/20 bg-transparent py-3 text-base text-ink placeholder:text-ink/35 focus:border-ink/70 focus:outline-none";

export function ContactView() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <EditorialHero
        eyebrow="Contact"
        title="Let's talk"
        accent="two wheels."
        description="Questions about a bike, gear fit, or an order? Drop us a line — we usually reply within one business day."
      />

      <section aria-label="Motorock gallery" className="bg-ink">
        <div className="site-container border-b border-paper/10 py-14 lg:py-20">
          <p className="section-eyebrow text-accent">Showroom</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase text-paper sm:text-3xl">
            Drop by
          </h2>
          <p className="mt-2 max-w-lg text-sm text-paper/55">
            A glimpse of our space, the bikes, and the people behind Motorock.
          </p>
        </div>
        <ZoomParallax images={[...contactParallaxImages]} />
      </section>

      <section aria-labelledby="find-us-heading" className="relative bg-moto">
        <ContactMap>
          <div className="site-container pt-16 sm:pt-20 lg:pt-28">
            <h2
              id="find-us-heading"
              className="max-w-2xl font-display text-[clamp(2.25rem,6vw,4rem)] font-extrabold uppercase leading-[0.9] tracking-tight text-ink"
            >
              Find us in <span className="text-accent">Tallinn</span>
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={SHOWROOM_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
              >
                Google Maps →
              </a>
              <a
                href={SHOWROOM_WAZE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-ink/15 bg-paper px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface"
              >
                Waze →
              </a>
            </div>
          </div>
        </ContactMap>
      </section>

      <section className="relative overflow-hidden bg-moto pt-10 pb-16 lg:pt-14 lg:pb-24">
        <span
          className="pointer-events-none absolute -right-6 top-10 hidden select-none font-display text-[clamp(5rem,18vw,12rem)] font-extrabold uppercase leading-none tracking-tighter text-ink/[0.05] lg:block"
          aria-hidden="true"
        >
          Talk
        </span>

        <div className="site-container relative z-10 lg:grid lg:grid-cols-12 lg:items-start">
            <div className="hidden lg:col-span-4 lg:block">
              <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
                Usually within one business day
              </p>
              <p className="mt-4 max-w-sm font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                No call centre.
                <br />
                <span className="text-accent">Real people.</span>
              </p>
            </div>

            <div className="border border-ink/15 p-6 sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
              <h2 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-3xl">
                Send a line
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink/50 lg:hidden">
                Usually within one business day.
              </p>

              {submitted ? (
                <div className="mt-10">
                  <p className="font-display text-lg font-extrabold uppercase leading-snug tracking-tight text-ink">
                    Message received
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    Thanks — we&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className={fieldLabelClassName}>
                        Name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Your name"
                        className={`mt-2 ${fieldClassName}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={fieldLabelClassName}>
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@email.com"
                        className={`mt-2 ${fieldClassName}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className={fieldLabelClassName}>
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      className={`mt-2 ${fieldClassName} cursor-pointer`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a topic
                      </option>
                      <option value="motorcycles">Motorcycles & test rides</option>
                      <option value="equipment">Equipment & sizing</option>
                      <option value="orders">Orders & delivery</option>
                      <option value="other">Something else</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={fieldLabelClassName}>
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={4}
                      placeholder="What's on your mind?"
                      className={`mt-2 resize-y ${fieldClassName}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
                  >
                    Send message →
                  </button>
                </form>
              )}
            </div>
          </div>
      </section>
    </>
  );
}
