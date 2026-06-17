"use client";

import { useState, type FormEvent } from "react";
import { EditorialHero } from "@/components/content/editorial-hero";
import { ContactMap } from "@/components/contact/contact-map";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import type { Locale } from "@/i18n/config";
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
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40";

const fieldClassName =
  "w-full border-0 border-b border-ink/20 bg-transparent py-3 text-base text-ink placeholder:text-ink/35 focus:border-ink/70 focus:outline-none";

type ContactViewProps = {
  locale: Locale;
};

const copy = {
  en: {
    hero: {
      eyebrow: "Contact",
      title: "Let's talk",
      accent: "two wheels.",
      description:
        "Questions about a bike, gear fit, or an order? Drop us a line — we usually reply within one business day.",
    },
    gallery: {
      eyebrow: "Showroom",
      title: "Drop by",
      description: "A glimpse of our space, the bikes, and the people behind Motorock.",
    },
    findUs: "Find us in",
    maps: "Google Maps →",
    talk: "Talk",
    replyWithin: "Usually within one business day",
    noCallCenter: "No call centre.",
    realPeople: "Real people.",
    sendLine: "Send a line",
    submittedTitle: "Message received",
    submittedBody: "Thanks — we'll get back to you soon.",
    labels: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
    },
    placeholders: {
      name: "Your name",
      email: "you@email.com",
      message: "What's on your mind?",
      topic: "Select a topic",
    },
    topics: {
      motorcycles: "Motorcycles & test rides",
      equipment: "Equipment & sizing",
      orders: "Orders & delivery",
      other: "Something else",
    },
    send: "Send message →",
  },
  et: {
    hero: {
      eyebrow: "Kontakt",
      title: "Räägime",
      accent: "kahest rattast.",
      description:
        "Küsimus ratta, varustuse sobivuse või tellimuse kohta? Kirjuta meile — vastame tavaliselt ühe tööpäeva jooksul.",
    },
    gallery: {
      eyebrow: "Showroom",
      title: "Tule läbi",
      description: "Pilguheit meie ruumi, ratastesse ja inimestesse Motorocki taga.",
    },
    findUs: "Leiad meid",
    maps: "Google Maps →",
    talk: "Räägi",
    replyWithin: "Tavaliselt ühe tööpäeva jooksul",
    noCallCenter: "Ei mingit kõnekeskust.",
    realPeople: "Päris inimesed.",
    sendLine: "Saada kiri",
    submittedTitle: "Sõnum käes",
    submittedBody: "Aitäh — vastame sulle peagi.",
    labels: {
      name: "Nimi",
      email: "E-post",
      subject: "Teema",
      message: "Sõnum",
    },
    placeholders: {
      name: "Sinu nimi",
      email: "sina@email.com",
      message: "Mis sul mõttes on?",
      topic: "Vali teema",
    },
    topics: {
      motorcycles: "Mootorrattad ja proovisõidud",
      equipment: "Varustus ja suurused",
      orders: "Tellimused ja tarne",
      other: "Midagi muud",
    },
    send: "Saada sõnum →",
  },
} as const;

export function ContactView({ locale }: ContactViewProps) {
  const t = copy[locale];
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <EditorialHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        accent={t.hero.accent}
        description={t.hero.description}
      />

      <section aria-label="Motorock gallery" className="bg-ink">
        <div className="site-container border-b border-paper/10 py-14 lg:py-20">
          <p className="section-eyebrow text-accent">{t.gallery.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase text-paper sm:text-3xl">
            {t.gallery.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-paper/55">
            {t.gallery.description}
          </p>
        </div>
        <ZoomParallax images={[...contactParallaxImages]} />
      </section>

      <section aria-labelledby="find-us-heading" className="relative bg-moto">
        <ContactMap>
          <div className="site-container pt-16 sm:pt-20 lg:pt-28">
            <h2
              id="find-us-heading"
              className="max-w-2xl font-display text-[clamp(2.5rem,6.6vw,4.4rem)] font-extrabold uppercase leading-[0.9] tracking-tight text-ink"
            >
              {t.findUs} <span className="text-accent">Tallinn</span>
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={SHOWROOM_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
              >
                {t.maps}
              </a>
              <a
                href={SHOWROOM_WAZE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-ink/15 bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface"
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
          {t.talk}
        </span>

        <div className="site-container relative z-10 lg:grid lg:grid-cols-12 lg:items-start">
            <div className="hidden lg:col-span-4 lg:block">
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
                {t.replyWithin}
              </p>
              <p className="mt-4 max-w-sm font-display text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                {t.noCallCenter}
                <br />
                <span className="text-accent">{t.realPeople}</span>
              </p>
            </div>

            <div className="border border-ink/15 p-6 sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
              <h2 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-4xl">
                {t.sendLine}
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink/50 lg:hidden">
                Usually within one business day.
              </p>

              {submitted ? (
                <div className="mt-10">
                  <p className="font-display text-xl font-extrabold uppercase leading-snug tracking-tight text-ink">
                    {t.submittedTitle}
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    {t.submittedBody}
                  </p>
                </div>
              ) : (
                <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className={fieldLabelClassName}>
                        {t.labels.name}
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder={t.placeholders.name}
                        className={`mt-2 ${fieldClassName}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={fieldLabelClassName}>
                        {t.labels.email}
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
                        {t.labels.subject}
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      className={`mt-2 ${fieldClassName} cursor-pointer`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {t.placeholders.topic}
                      </option>
                      <option value="motorcycles">{t.topics.motorcycles}</option>
                      <option value="equipment">{t.topics.equipment}</option>
                      <option value="orders">{t.topics.orders}</option>
                      <option value="other">{t.topics.other}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={fieldLabelClassName}>
                      {t.labels.message}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={4}
                      placeholder={t.placeholders.message}
                      className={`mt-2 resize-y ${fieldClassName}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
                  >
                    {t.send}
                  </button>
                </form>
              )}
            </div>
          </div>
      </section>
    </>
  );
}
