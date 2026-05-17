import { ImageResponse } from "next/og";

// Browser tab favicon. Smaller, simpler than the home-screen icon — just the
// gold monogram on ink so it's recognizable at 32px.
export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          color: "#d99a2b",
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: -1,
          fontFamily: "ui-serif, Georgia, serif",
        }}
      >
        247
      </div>
    ),
    { ...size }
  );
}
