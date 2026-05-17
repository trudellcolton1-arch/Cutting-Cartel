import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "24/7 Cuts — Mobile Barber",
    short_name: "24/7 Cuts",
    description:
      "Dallas mobile barber. Book a cut, prepay online, and we come to you. Try on hairstyles with Cutline AI before we arrive.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#0a0a0b",
    theme_color: "#d99a2b",
    orientation: "portrait",
    lang: "en-US",
    dir: "ltr",
    categories: ["lifestyle", "business"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png", purpose: "any" },
      { src: "/icon1", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon1", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Try a cut with Cutline AI",
        short_name: "Try On",
        description: "Upload a selfie and try on hairstyles with AI",
        url: "/try-on",
        icons: [{ src: "/icon1", sizes: "192x192" }],
      },
      {
        name: "Book a cut",
        short_name: "Book",
        description: "Pick a time and we come to you",
        url: "/booking",
        icons: [{ src: "/icon1", sizes: "192x192" }],
      },
    ],
  };
}
