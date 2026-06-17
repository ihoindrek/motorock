"use client";

import { ShopModal } from "@/components/ui/shop-modal";
import { MotorcycleEnquiryForm } from "@/components/shop/motorcycle-enquiry-form";
import { TestRideForm } from "@/components/shop/test-ride-form";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
  SHOWROOM_WAZE_URL,
} from "@/data/showroom";

export type MotorcycleModalAction =
  | "test-ride"
  | "enquire"
  | "question"
  | "showroom"
  | "contact";

type MotorcycleActionModalsProps = {
  action: MotorcycleModalAction | null;
  onClose: () => void;
  product: {
    slug: string;
    name: string;
    brand: string;
    color?: string;
  };
};

const modalCopy: Record<
  MotorcycleModalAction,
  { eyebrow: string; title: string; description?: string; size?: "md" | "lg" }
> = {
  "test-ride": {
    eyebrow: "Test ride",
    title: "Book a test ride",
    description:
      "Pick a time — we'll have the bike ready. We usually confirm within one business day.",
    size: "lg",
  },
  enquire: {
    eyebrow: "Enquiry",
    title: "Enquire about this model",
    description:
      "Not on display right now? Tell us you're interested and we'll help with ordering or a viewing.",
    size: "lg",
  },
  question: {
    eyebrow: "Contact",
    title: "Ask a question",
    description: "Specs, financing, delivery — ask away. Real people, not a call centre.",
    size: "lg",
  },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    description: "We'll check availability and follow up with options.",
    size: "lg",
  },
  showroom: {
    eyebrow: "Showroom",
    title: "Visit us in Tallinn",
    description: "Drop by to see the bikes and talk through options in person.",
  },
};

export function MotorcycleActionModals({
  action,
  onClose,
  product,
}: MotorcycleActionModalsProps) {
  if (!action) {
    return null;
  }

  const copy = modalCopy[action];

  return (
    <ShopModal
      open={action !== null}
      onClose={onClose}
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      size={copy.size}
    >
      {action === "test-ride" ? (
        <TestRideForm
          idPrefix="modal-test-ride"
          initial={{
            slug: product.slug,
            bike: product.name,
            brand: product.brand,
            color: product.color,
          }}
        />
      ) : null}

      {action === "enquire" ? (
        <MotorcycleEnquiryForm
          idPrefix="modal-enquire"
          slug={product.slug}
          bikeName={product.name}
          brand={product.brand}
          color={product.color}
          intent="enquire"
        />
      ) : null}

      {action === "question" ? (
        <MotorcycleEnquiryForm
          idPrefix="modal-question"
          slug={product.slug}
          bikeName={product.name}
          brand={product.brand}
          color={product.color}
          intent="question"
        />
      ) : null}

      {action === "contact" ? (
        <MotorcycleEnquiryForm
          idPrefix="modal-contact"
          slug={product.slug}
          bikeName={product.name}
          brand={product.brand}
          color={product.color}
          intent="availability"
        />
      ) : null}

      {action === "showroom" ? (
        <div className="space-y-8">
          <div>
            <p className={shopEyebrowClassName}>Address</p>
            <p className="mt-2 text-base leading-relaxed text-ink/75">
              {SHOWROOM.name}
              <br />
              {SHOWROOM.addressLine}
              <br />
              {SHOWROOM.city}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={SHOWROOM_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
            >
              Google Maps →
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

          <p className="text-sm leading-relaxed text-ink/55">
            {product.name
              ? `Interested in the ${product.brand} ${product.name}? Mention it when you visit — or send an enquiry and we'll confirm what's on display.`
              : "Walk-ins welcome. Bring your licence if you'd like to discuss a test ride."}
          </p>

          <button
            type="button"
            onClick={() => onClose()}
            className="inline-flex items-center font-body text-xs font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
          >
            Close
          </button>
        </div>
      ) : null}
    </ShopModal>
  );
}

const shopEyebrowClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40";
