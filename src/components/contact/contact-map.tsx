import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ContactMapGoogle = dynamic(
  () =>
    import("@/components/contact/contact-map-google").then(
      (module) => module.ContactMapGoogle,
    ),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-detail" aria-hidden="true" />,
  },
);

export function ContactMap({ children }: { children?: ReactNode }) {
  return (
    <div className="relative w-full bg-moto">
      <div className="relative h-[68vh] min-h-[28rem] w-full sm:min-h-[34rem] lg:h-[78vh] lg:min-h-[40rem]">
        <div className="absolute inset-0">
          <ContactMapGoogle />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-moto/25"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-28 bg-gradient-to-t from-moto via-moto/70 to-transparent sm:h-36 lg:h-44"
          aria-hidden="true"
        />

        {children ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[3]">
            <div className="pointer-events-auto">{children}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
