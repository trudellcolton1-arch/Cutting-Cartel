import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Cutline AI — The Cutting Cartel",
  description:
    "AI-powered haircut try-on and booking. Lock in your fade before you sit in the chair. Built by The Cutting Cartel — Dallas, TX.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cuttingcartel.com"),
  openGraph: {
    title: "Cutline AI — The Cutting Cartel",
    description: "Try on your next cut with AI. Book your barber. Pay up front.",
    type: "website",
    siteName: "Cutline AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cutline AI — The Cutting Cartel",
    description: "Try on your next cut with AI. Book your barber. Pay up front.",
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
