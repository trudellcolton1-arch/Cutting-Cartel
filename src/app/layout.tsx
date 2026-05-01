import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "The Cutting Cartel — Dallas's premier barber experience",
    template: "%s · The Cutting Cartel",
  },
  description:
    "The Cutting Cartel — Dallas, TX. Book your chair, prepay online, and use Cutline AI to try on your next cut before you sit down.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cuttingcartel.com"),
  openGraph: {
    title: "The Cutting Cartel",
    description:
      "Dallas barbershop. Book your chair, prepay, and use Cutline AI to try on your cut before the clippers touch your head.",
    type: "website",
    siteName: "The Cutting Cartel",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Cutting Cartel",
    description:
      "Dallas barbershop. Book your chair, prepay, try on your cut with Cutline AI.",
    creator: "@cuttingcartel",
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
