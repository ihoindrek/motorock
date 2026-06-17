import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Racing_Sans_One } from "next/font/google";
import { Providers } from "@/components/providers";
import { isSiteIndexable } from "@/lib/site-indexing";
import "./globals.css";

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
    default: "Motorock.eu — Premium Custom Motorcycles",
    template: "%s | Motorock.eu",
  },
  description:
    "Hand-built custom motorcycles, premium parts, and rebel engineering. Motorock.eu — ride loud, ride free.",
  metadataBase: new URL("https://motorock.eu"),
  openGraph: {
    title: "Motorock.eu — Premium Custom Motorcycles",
    description:
      "Hand-built custom motorcycles, premium parts, and rebel engineering.",
    siteName: "Motorock.eu",
    locale: "en_EU",
    type: "website",
  },
  ...(isSiteIndexable() ? {} : noIndexMetadata),
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${plusJakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-paper font-body text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
