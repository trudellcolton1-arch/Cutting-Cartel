import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cuttingcartel.com";
const OG_IMAGE = `${APP_URL}/api/og`;

export const metadata: Metadata = {
  title: {
    default: "The Cutting Cartel — Dallas's premier barber experience",
    template: "%s · The Cutting Cartel",
  },
  description:
    "The Cutting Cartel — Dallas, TX. Book your chair, prepay online, and use Cutline AI to try on your next cut before you sit down.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "The Cutting Cartel",
    description:
      "Dallas barbershop. Book your chair, prepay, and use Cutline AI to try on your cut before the clippers touch your head.",
    url: APP_URL,
    type: "website",
    siteName: "The Cutting Cartel",
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The Cutting Cartel — Dallas, TX",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Cutting Cartel",
    description:
      "Dallas barbershop. Book your chair, prepay, try on your cut with Cutline AI.",
    creator: "@cuttingcartel",
    images: [OG_IMAGE],
  },
  other: {
    // explicit fallbacks some scrapers (iMessage especially) prefer
    "og:image": OG_IMAGE,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:type": "image/png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-900 text-bone-50">
        <Providers>
          <SiteHeader />
          <main className="min-h-[calc(100vh-12rem)]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
