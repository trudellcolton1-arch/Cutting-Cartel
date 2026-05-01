import type { MetadataRoute } from "next";

// Lets customers "Add to Home Screen" with branded title, theme, and icons.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Cutting Cartel",
    short_name: "Cutting Cartel",
    description:
      "Dallas barbershop. Book your chair, prepay online, and use Cutline AI to try on your cut before you sit down.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#d99a2b",
    orientation: "portrait",
    categories: ["lifestyle", "business"],
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
