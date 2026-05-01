import { ImageResponse } from "next/og";

// Stable, scraper-friendly OG endpoint.
// Used by every share preview (iMessage, Twitter, Slack, Discord, WhatsApp, Facebook).
// Satori (next/og's renderer) only supports a subset of CSS — no
// repeating-linear-gradient, no shorthand backgrounds with multiple layers.
// Stick to solid colors, simple linear-gradient, and explicit divs.
export const runtime = "edge";

const STRIPE_COLORS = ["#d99a2b", "#0a0a0b", "#fafaf7", "#0a0a0b"];

function Stripe({ width = 240, height = 8 }: { width?: number; height?: number }) {
  // barbershop pole stripe rendered as a flex row of solid blocks
  const blockCount = 18;
  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: blockCount }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: STRIPE_COLORS[i % STRIPE_COLORS.length],
            display: "flex",
          }}
        />
      ))}
    </div>
  );
}

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
        {/* gold radial glow — Satori supports radial-gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 0%, rgba(217,154,43,0.45) 0%, rgba(10,10,11,0) 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 0% 100%, rgba(16,211,154,0.20) 0%, rgba(10,10,11,0) 60%)",
            display: "flex",
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
            height: "100%",
          }}
        >
          {/* top row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
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
              <span style={{ display: "flex" }}>The Cutting</span>
              <span style={{ color: "#f5c46b", display: "flex" }}>Cartel.</span>
            </div>
            <div
              style={{
                fontSize: 28,
                color: "rgba(250,250,247,0.75)",
                marginTop: 12,
                display: "flex",
              }}
            >
              Book the chair · prepay online · try on your cut with AI
            </div>
          </div>

          {/* bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
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
              <div
                style={{
                  fontSize: 18,
                  color: "rgba(250,250,247,0.6)",
                  display: "flex",
                }}
              >
                cuttingcartel.com
              </div>
              <Stripe />
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
        "cache-control":
          "public, immutable, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
