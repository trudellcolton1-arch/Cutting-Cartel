import { ImageResponse } from "next/og";

// 512x512 — used by Google Play Store listing as the high-res app icon
// AND as the maskable icon in the PWA manifest.
export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon512() {
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
              "radial-gradient(circle at 50% 30%, rgba(217,154,43,0.6) 0%, rgba(10,10,11,0) 70%)",
            display: "flex",
          }}
        />
        {/* Barbershop stripe at the bottom edge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 18,
            display: "flex",
          }}
        >
          {[
            "#d99a2b","#0a0a0b","#fafaf7","#0a0a0b",
            "#d99a2b","#0a0a0b","#fafaf7","#0a0a0b",
            "#d99a2b","#0a0a0b","#fafaf7","#0a0a0b",
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, display: "flex" }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 376,
            height: 376,
            borderRadius: 188,
            background: "#d99a2b",
            color: "#0a0a0b",
            fontSize: 172,
            fontWeight: 900,
            letterSpacing: -6,
            fontFamily: "ui-serif, Georgia, serif",
            boxShadow: "0 50px 140px rgba(217,154,43,0.55)",
          }}
        >
          247
        </div>
      </div>
    ),
    { ...size }
  );
}
