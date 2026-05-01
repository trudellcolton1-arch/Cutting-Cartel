import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cutline AI · The Cutting Cartel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static landing-page OG card. Lush, brand-perfect, gold-on-ink.
export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0b",
          color: "#fafaf7",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* radial gold glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 500px at 80% -10%, rgba(217,154,43,0.45), transparent 60%), radial-gradient(700px 400px at -10% 110%, rgba(16,211,154,0.18), transparent 60%)",
            display: "flex",
          }}
        />

        {/* faint grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
            opacity: 0.45,
          }}
        />

        {/* content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 80px",
            width: "100%",
          }}
        >
          {/* top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: "#d99a2b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0a0a0b",
                  fontSize: 36,
                  fontWeight: 800,
                }}
              >
                ✂
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Cutline AI</div>
                <div
                  style={{
                    fontSize: 14,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: "#f5c46b",
                    opacity: 0.85,
                  }}
                >
                  The Cutting Cartel
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(217,154,43,0.5)",
                color: "#f5c46b",
                fontSize: 18,
                gap: 8,
              }}
            >
              ✨ AI hairstyle try-on
            </div>
          </div>

          {/* hero copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 110,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 0.95,
                color: "#fafaf7",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>See the cut.</span>
              <span style={{ color: "#f5c46b" }}>Lock the line.</span>
            </div>
            <div style={{ fontSize: 28, color: "rgba(250,250,247,0.75)", marginTop: 12 }}>
              Try on hairstyles with AI · book your barber · prepay the chair
            </div>
          </div>

          {/* bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {["Fade", "Taper", "Textured", "Skin", "Design"].map((s) => (
                <div
                  key={s}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    background: "rgba(217,154,43,0.12)",
                    color: "#f5c46b",
                    fontSize: 18,
                    border: "1px solid rgba(217,154,43,0.35)",
                    display: "flex",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 18, color: "rgba(250,250,247,0.6)" }}>cuttingcartel.com</div>
              <div
                style={{
                  width: 240,
                  height: 8,
                  borderRadius: 4,
                  background:
                    "repeating-linear-gradient(45deg, #d99a2b 0 8px, #0a0a0b 8px 16px, #fafaf7 16px 24px, #0a0a0b 24px 32px)",
                  display: "flex",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
