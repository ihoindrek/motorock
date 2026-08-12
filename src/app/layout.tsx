import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Racing_Sans_One } from "next/font/google";
import { ConsentScripts, GtmNoScript } from "@/components/consent/consent-scripts";
import { Providers } from "@/components/providers";
import { defaultLocale, locales } from "@/i18n/config";
import { isSiteIndexable } from "@/lib/site-indexing";
import { getStorefrontUrl } from "@/lib/storefront/url";
import { getAssetVersion } from "@/lib/storefront/asset-version";
import "./globals.css";

const assetVersion = getAssetVersion();
const favicon32Url = `/favicon-32.png?v=${assetVersion}`;
const favicon192Url = `/favicon.png?v=${assetVersion}`;

const displayFont = Racing_Sans_One({
  subsets: ["latin"],
  variable: "--font-racing-sans-one",
  weight: "400",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const metadata: Metadata = {
  title: {
    default: "Motorock.eu",
    template: "%s | Motorock.eu",
  },
  metadataBase: new URL(getStorefrontUrl()),
  ...(process.env.GOOGLE_SITE_VERIFICATION?.trim()
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION.trim(),
        },
      }
    : {}),
  icons: {
    icon: [
      { url: favicon32Url, sizes: "32x32", type: "image/png" },
      { url: favicon192Url, sizes: "192x192", type: "image/png" },
    ],
    shortcut: [{ url: favicon32Url, type: "image/png" }],
    apple: [{ url: favicon192Url, sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: "Motorock.eu",
    type: "website",
  },
  other: {
    "norton-safeweb-site-verification":
      "X7N74AJA0BO160NS6G3GX71LPXP77JB1-N37NX1IL6WWR045FCP-BFBD0HI912M534XYDIIAWOGU5PMIVJBRT99KW45S1NO5YY24-5JYBZ3B4MRG2I4VYZSAN2MN17ZC",
  },
  ...(isSiteIndexable() ? {} : noIndexMetadata),
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  colorScheme: "light",
};

/**
 * Sets <html lang> from the URL before first paint. The root layout cannot
 * read the locale on the server without headers(), which would force every
 * route dynamic and disable ISR/CDN caching.
 */
const langScript = `document.documentElement.lang=${JSON.stringify(
  Object.fromEntries(locales.map((locale) => [locale, locale])),
)}[location.pathname.split("/")[1]]||${JSON.stringify(defaultLocale)};`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      className={`${displayFont.variable} ${plusJakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-paper font-body text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <GtmNoScript />
        <ConsentScripts />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
