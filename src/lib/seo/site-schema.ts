import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { SITE_NAME } from "@/lib/seo/metadata";
import { getStorefrontUrl } from "@/lib/storefront/url";
import { SHOWROOM } from "@/data/showroom";
import type { BlogPost } from "@/types/blog-post";

const SOCIAL_PROFILES = [
  "https://www.instagram.com/motorock.eu",
  "https://www.facebook.com/scramblers.caferacers",
  "https://www.tiktok.com/@motorock909",
];

function origin() {
  return getStorefrontUrl();
}

function organizationId() {
  return `${origin()}/#organization`;
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE_NAME,
    url: origin(),
    logo: `${origin()}/logo.png`,
    email: SHOWROOM.email,
    telephone: SHOWROOM.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SHOWROOM.addressLine,
      addressLocality: SHOWROOM.city,
      addressCountry: "EE",
    },
    sameAs: SOCIAL_PROFILES,
  };
}

export function buildWebsiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${origin()}${localizedHref(locale, "/")}`,
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin()}${localizedHref(locale, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type BreadcrumbItem = {
  name: string;
  /** Absolute URL. Omit on the final crumb (current page). */
  url?: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function buildBlogPostingJsonLd(post: BlogPost, canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    ...(post.image ? { image: [post.image] } : {}),
    datePublished: post.publishedAt,
    mainEntityOfPage: canonicalUrl,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@id": organizationId() },
    publisher: { "@id": organizationId() },
  };
}
