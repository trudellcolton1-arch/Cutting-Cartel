import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileTabBar } from "@/components/MobileTabBar";

// Normalize a possibly-malformed URL string. Trims whitespace, collapses
// duplicated "https://" prefixes, and falls back to the production domain.
function normalizeUrl(raw: string | undefined | null, fallback: string): string {
  if (!raw) return fallback;
  let s = raw.trim();
  s = s.replace(/^(https?:\/\/\s*)+(https?:\/\/)/i, "$2");
  s = s.replace(/^\s+/, "");
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/\s+/g, "");
  try {
    new URL(s);
    return s;
  } catch {
    return fallback;
  }
}

const FALLBACK_URL = "https://247cuts.com";

function getAppUrl() {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) {
      const candidate = `${proto}://${host}`.trim();
      try {
        new URL(candidate);
        return candidate;
      } catch {
        /* fall through */
      }
    }
  } catch {
    /* headers() not available during static prerender */
  }
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL, FALLBACK_URL);
}

export async function generateMetadata(): Promise<Metadata> {
  const APP_URL = getAppUrl();
  const OG_IMAGE = `${APP_URL}/api/og`;

  return {
    title: {
      default: "24/7 Cuts — Dallas's premier barber experience",
      template: "%s · 24/7 Cuts",
    },
    description:
      "24/7 Cuts — Dallas, TX. Book your chair, prepay online, and use Cutline AI to try on your next cut before you sit down.",
    metadataBase: new URL(APP_URL),
    openGraph: {
      title: "24/7 Cuts",
      description:
        "Dallas barbershop. Book your chair, prepay, and use Cutline AI to try on your cut before the clippers touch your head.",
      url: APP_URL,
      type: "website",
      siteName: "24/7 Cuts",
      images: [
        {
          url: OG_IMAGE,
          secureUrl: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "24/7 Cuts — Dallas, TX",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "24/7 Cuts",
      description:
        "Dallas barbershop. Book your chair, prepay, try on your cut with Cutline AI.",
      creator: "@247cuts",
      images: [OG_IMAGE],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="24/7 Cuts" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-ink-900 text-bone-50">
        <Providers>
          <SiteHeader />
          <main className="min-h-[calc(100vh-12rem)] pb-20 md:pb-0">{children}</main>
          <SiteFooter />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
