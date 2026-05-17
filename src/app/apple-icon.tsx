import { ImageResponse } from "next/og";

// 180x180 icon iOS uses when a customer adds the site to their home screen.
// iOS rounds the corners automatically, so we go full bleed.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
        {/* gold halo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 30%, rgba(217,154,43,0.55) 0%, rgba(10,10,11,0) 70%)",
            display: "flex",
          }}
        />
        {/* faint barbershop stripe at the bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            display: "flex",
          }}
        >
          {[
            "#d99a2b",
            "#0a0a0b",
            "#fafaf7",
            "#0a0a0b",
            "#d99a2b",
            "#0a0a0b",
            "#fafaf7",
            "#0a0a0b",
            "#d99a2b",
            "#0a0a0b",
          ].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, display: "flex" }} />
          ))}
        </div>

        {/* monogram disc */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 66,
            background: "#d99a2b",
            color: "#0a0a0b",
            fontSize: 60,
            fontWeight: 900,
            letterSpacing: -2,
            boxShadow: "0 16px 48px rgba(217,154,43,0.55)",
            fontFamily: "ui-serif, Georgia, serif",
          }}
        >
          247
        </div>
      </div>
    ),
    { ...size }
  );
}
