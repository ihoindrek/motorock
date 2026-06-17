import Link from "next/link";
import { defaultLocale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";

export default function NotFound() {
  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">404</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        This page does not exist or has moved. Try the shop or search instead.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={localizedHref(defaultLocale, "/shop/equipment")}
          className="btn-accent"
        >
          Shop equipment
        </Link>
        <Link href={localizedHref(defaultLocale, "/search")} className="btn-ghost">
          Search
        </Link>
      </div>
    </div>
  );
}
