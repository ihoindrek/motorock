"use client";

import { useMemo } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { ShopModal } from "@/components/ui/shop-modal";
import { MotorcycleEnquiryForm } from "@/components/shop/motorcycle-enquiry-form";
import { TestRideForm } from "@/components/shop/test-ride-form";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
  SHOWROOM_WAZE_URL,
  getShowroomCopy,
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

export function MotorcycleActionModals({
  action,
  onClose,
  product,
}: MotorcycleActionModalsProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const showroom = getShowroomCopy(locale);
  const modals = dict.motorcycle.modals;

  const modalCopy = useMemo(
    () =>
      ({
        "test-ride": {
          eyebrow: modals.testRideEyebrow,
          title: modals.testRideTitle,
          description: modals.testRideDescription,
          size: "lg" as const,
        },
        enquire: {
          eyebrow: modals.enquireEyebrow,
          title: modals.enquireTitle,
          description: modals.enquireDescription,
          size: "lg" as const,
        },
        question: {
          eyebrow: modals.questionEyebrow,
          title: modals.questionTitle,
          description: modals.questionDescription,
          size: "lg" as const,
        },
        contact: {
          eyebrow: modals.contactEyebrow,
          title: modals.contactTitle,
          description: modals.contactDescription,
          size: "lg" as const,
        },
        showroom: {
          eyebrow: modals.showroomEyebrow,
          title: modals.showroomTitle,
          description: modals.showroomDescription,
        },
      }) satisfies Record<
        MotorcycleModalAction,
        {
          eyebrow: string;
          title: string;
          description?: string;
          size?: "md" | "lg";
        }
      >,
    [modals],
  );

  if (!action) {
    return null;
  }

  const copy = modalCopy[action];
  const showroomNote = product.name
    ? modals.showroomInterested
        .replace("{brand}", product.brand)
        .replace("{name}", product.name)
    : modals.showroomWalkIns;

  return (
    <ShopModal
      open={action !== null}
      onClose={onClose}
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      size={"size" in copy ? copy.size : undefined}
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
            <p className={shopEyebrowClassName}>{modals.address}</p>
            <p className="mt-2 text-base leading-relaxed text-ink/75">
              {showroom.name}
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
              {modals.googleMaps}
            </a>
            <a
              href={SHOWROOM_WAZE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-ink/15 bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface"
            >
              {modals.waze}
            </a>
          </div>

          <p className="text-sm leading-relaxed text-ink/55">{showroomNote}</p>

          <button
            type="button"
            onClick={() => onClose()}
            className="inline-flex items-center font-body text-xs font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
          >
            {dict.common.close}
          </button>
        </div>
      ) : null}
    </ShopModal>
  );
}

const shopEyebrowClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40";
