"use client";

import { useState, type FormEvent } from "react";
import { EditorialHero } from "@/components/content/editorial-hero";
import { ContactMap } from "@/components/contact/contact-map";
import { FormHoneypot } from "@/components/forms/form-honeypot";
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { useDictionary } from "@/context/locale-context";
import type { Locale } from "@/i18n/config";
import type { ContactTopic } from "@/lib/forms/types";
import { submitForm } from "@/lib/forms/submit-form-client";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
  SHOWROOM_WAZE_URL,
  getShowroomCopy,
} from "@/data/showroom";

const fieldLabelClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40";

const fieldClassName =
  "w-full border-0 border-b border-ink/20 bg-transparent py-3 text-base text-ink placeholder:text-ink/35 focus:border-ink/70 focus:outline-none";

function ShowroomInfoCard({
  locale,
  variant,
  className = "",
}: {
  locale: Locale;
  variant: "light" | "dark";
  className?: string;
}) {
  const t = copy[locale];
  const showroom = getShowroomCopy(locale);
  const isDark = variant === "dark";
  const labelClassName = isDark
    ? "font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/40"
    : fieldLabelClassName;
  const boxClassName = isDark
    ? "border border-paper/10 bg-ink p-5 sm:p-6"
    : "border border-ink/15 bg-paper p-5 sm:p-6";
  const textClassName = isDark ? "text-paper" : "text-ink";
  const linkClassName = isDark
    ? "text-paper underline-offset-2 hover:text-accent hover:underline"
    : "text-ink underline-offset-2 hover:text-accent hover:underline";

  return (
    <div className={`${boxClassName} ${className}`.trim()}>
      <div className={`space-y-5 ${textClassName}`}>
        <div>
          <p className={labelClassName}>{t.shopLabel}</p>
          <p className="mt-2 text-base leading-relaxed">
            {showroom.name}
            <br />
            {SHOWROOM.addressLine}, {SHOWROOM.city}
          </p>
        </div>

        <div>
          <p className={labelClassName}>{t.openLabel}</p>
          <p className="mt-2 text-base leading-relaxed">
            {showroom.hours.weekdays}
            <br />
            {showroom.hours.saturday}
            <br />
            {showroom.hours.sunday}
          </p>
        </div>

        <div>
          <p className={labelClassName}>{t.phoneLabel}</p>
          <p className="mt-2 text-base leading-relaxed">
            {showroom.phoneNote}
            <br />
            <a href={SHOWROOM.phoneHref} className={linkClassName}>
              {SHOWROOM.phone}
            </a>
          </p>
        </div>

        <div>
          <p className={labelClassName}>{t.emailLabel}</p>
          <p className="mt-2 text-base leading-relaxed">
            <a href={SHOWROOM.emailHref} className={linkClassName}>
              {SHOWROOM.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

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
      ariaLabel: "Motorock gallery",
    },
    parallaxImages: [
      { src: "/c1.webp", alt: "Motorock showroom" },
      { src: "/c2.webp", alt: "Motorock motorcycles" },
      { src: "/c3.webp", alt: "Motorock team" },
      { src: "/c4.webp", alt: "Motorock workshop" },
      { src: "/c5.webp", alt: "Motorock riding gear" },
      { src: "/c6.webp", alt: "Motorock bikes on display" },
      { src: "/c7.webp", alt: "Motorock lifestyle" },
    ],
    findUs: "Find us in",
    maps: "Google Maps →",
    waze: "Waze →",
    talk: "Talk",
    replyWithin: "Usually within one business day",
    noCallCenter: "No call centre.",
    realPeople: "Real people.",
    shopLabel: "Tallinn shop",
    openLabel: "Open",
    phoneLabel: "Phone",
    emailLabel: "Email",
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
      eyebrow: "Võta ühendust",
      title: "Kontakt",
      description:
        "Küsimus ratta, varustuse sobivuse või tellimuse kohta? Kirjuta meile — vastame tavaliselt ühe tööpäeva jooksul.",
    },
    gallery: {
      eyebrow: "Motorock salong",
      title: "Tule läbi",
      description: "Pilguheit meie salongi, ratastesse ja inimestesse Motorocki taga.",
      ariaLabel: "Motorocki galerii",
    },
    parallaxImages: [
      { src: "/c1.webp", alt: "Motorocki salong" },
      { src: "/c2.webp", alt: "Motorocki mootorrattad" },
      { src: "/c3.webp", alt: "Motorocki meeskond" },
      { src: "/c4.webp", alt: "Motorocki töökoda" },
      { src: "/c5.webp", alt: "Motorocki sõiduvarustus" },
      { src: "/c6.webp", alt: "Motorocki rattad saalis" },
      { src: "/c7.webp", alt: "Motorocki elustiil" },
    ],
    findUs: "Leiad meid",
    maps: "Google Maps →",
    waze: "Waze →",
    talk: "Räägi",
    replyWithin: "Tavaliselt ühe tööpäeva jooksul",
    noCallCenter: "Ei mingit kõnekeskust.",
    realPeople: "Päris inimesed.",
    shopLabel: "Motorock salong",
    openLabel: "Avatud",
    phoneLabel: "Telefon",
    emailLabel: "E-post",
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
  const dict = useDictionary();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);

    const result = await submitForm({
      type: "contact",
      locale,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      topic: String(data.get("subject") ?? "") as ContactTopic,
      message: String(data.get("message") ?? ""),
      _gotcha: String(data.get("_gotcha") ?? ""),
    });

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error || dict.forms.submitError);
      return;
    }

    setSubmitted(true);
  }

  return (
    <>
      <EditorialHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        accent={"accent" in t.hero ? t.hero.accent : undefined}
        description={t.hero.description}
      />

      <section aria-label={t.gallery.ariaLabel} className="bg-ink">
        <div className="site-container border-b border-paper/10 py-14 lg:py-20">
          <p className="section-eyebrow text-accent">{t.gallery.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase text-paper sm:text-3xl">
            {t.gallery.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-paper/55">
            {t.gallery.description}
          </p>
        </div>
        <ZoomParallax images={[...t.parallaxImages]} />
      </section>

      <section aria-labelledby="find-us-heading" className="relative bg-moto">
        <ContactMap>
          <div className="site-container pt-16 sm:pt-20 lg:pt-28">
            <h2
              id="find-us-heading"
              className="max-w-2xl font-body text-[clamp(2.5rem,6.6vw,4.4rem)] font-bold normal-case leading-[0.9] tracking-normal text-ink"
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
                {t.waze}
              </a>
            </div>
          </div>
        </ContactMap>

        <div className="site-container pb-12 pt-8 lg:hidden">
          <ShowroomInfoCard locale={locale} variant="light" />
        </div>
      </section>

      <section className="relative overflow-hidden bg-moto pt-10 pb-16 lg:pt-14 lg:pb-24">
        <span
          className="pointer-events-none absolute -right-6 top-10 hidden select-none font-body text-[clamp(5rem,18vw,12rem)] font-bold normal-case leading-none tracking-normal text-ink/[0.05] lg:block"
          aria-hidden="true"
        >
          {t.talk}
        </span>

        <div className="site-container relative z-10 lg:grid lg:grid-cols-12 lg:items-start">
            <div className="hidden lg:col-span-4 lg:block">
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
                {t.replyWithin}
              </p>
              <p className="mt-4 max-w-sm font-body text-[clamp(1.9rem,4.4vw,3rem)] font-bold normal-case leading-[0.95] tracking-normal text-ink">
                {t.noCallCenter}
                <br />
                <span className="text-accent">{t.realPeople}</span>
              </p>
              <ShowroomInfoCard
                locale={locale}
                variant="dark"
                className="mt-8 max-w-md"
              />
            </div>

            <div className="rounded-sm border-2 border-ink/25 bg-paper p-6 shadow-[0_16px_48px_rgb(11_11_11_/_0.08)] sm:p-8 lg:col-span-7 lg:col-start-6 lg:p-10">
              <h2 className="font-body text-3xl font-bold normal-case leading-tight tracking-normal text-ink sm:text-4xl">
                {t.sendLine}
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink/65 lg:hidden">
                {t.replyWithin}
              </p>

              {submitted ? (
                <div className="mt-10">
                  <p className="font-body text-xl font-bold normal-case leading-snug tracking-normal text-ink">
                    {t.submittedTitle}
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    {t.submittedBody}
                  </p>
                </div>
              ) : (
                <form className="relative mt-10 space-y-8" onSubmit={handleSubmit}>
                  <FormHoneypot />
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
                        placeholder={t.placeholders.email}
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

                  {submitError ? (
                    <p className="text-sm text-accent" role="alert">
                      {submitError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? dict.forms.submitting : t.send}
                  </button>
                </form>
              )}
            </div>
          </div>
      </section>
    </>
  );
}
