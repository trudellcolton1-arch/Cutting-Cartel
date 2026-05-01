import { ImageResponse } from "next/og";

// Stable, scraper-friendly OG endpoint at /api/og
// Used by every share preview (iMessage, Twitter, Slack, Discord, WhatsApp).
export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = 86400; // 24h CDN cache

export async function GET() {
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
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: "#f5c46b",
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                Dallas · Texas
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
              ✨ Powered by Cutline AI
            </div>
          </div>

          {/* hero */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 132,
                fontWeight: 900,
                letterSpacing: -4,
                lineHeight: 0.92,
                color: "#fafaf7",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>The Cutting</span>
              <span style={{ color: "#f5c46b" }}>Cartel.</span>
            </div>
            <div style={{ fontSize: 28, color: "rgba(250,250,247,0.75)", marginTop: 12, display: "flex" }}>
              Book the chair · prepay online · try on your cut with AI
            </div>
          </div>

          {/* bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {["Fades", "Tapers", "Designs", "Beards", "Edge-Ups"].map((s) => (
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
              <div style={{ fontSize: 18, color: "rgba(250,250,247,0.6)", display: "flex" }}>
                cuttingcartel.com
              </div>
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
    {
      width: 1200,
      height: 630,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
