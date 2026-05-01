import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Normalize a possibly-malformed URL string. Trims whitespace, collapses
// duplicated "https://" prefixes (a common copy-paste typo), and falls back
// to the production domain if parsing still fails. This keeps build-time
// prerender from crashing on a typo'd env var.
function normalizeUrl(raw: string | undefined | null, fallback: string): string {
  if (!raw) return fallback;
  let s = raw.trim();
  // collapse "https://https://...", "https:// https://...", "http:// https://..."
  s = s.replace(/^(https?:\/\/\s*)+(https?:\/\/)/i, "$2");
  // strip leading whitespace inside the URL
  s = s.replace(/^\s+/, "");
  // if it doesn't start with http(s)://, prepend https://
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // strip any internal whitespace
  s = s.replace(/\s+/g, "");
  try {
    // validate
    new URL(s);
    return s;
  } catch {
    return fallback;
  }
}

const FALLBACK_URL = "https://cuttingcartel.com";

// Resolve the absolute URL the scraper / browser is actually using so the
// og:image href points to the same host the page was loaded from. Falls back
// to NEXT_PUBLIC_APP_URL or the production domain.
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
  };
}

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
