import { ImageResponse } from "next/og";

// Required by PWA store packagers (Google Play, Microsoft Store) — 192x192
// is the de facto Android home-screen icon size.
export const runtime = "edge";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default async function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 32%, rgba(217,154,43,0.55) 0%, rgba(10,10,11,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 70,
            background: "#d99a2b",
            color: "#0a0a0b",
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: -4,
            fontFamily: "ui-serif, Georgia, serif",
            boxShadow: "0 18px 50px rgba(217,154,43,0.55)",
          }}
        >
          TC
        </div>
      </div>
    ),
    { ...size }
  );
}
