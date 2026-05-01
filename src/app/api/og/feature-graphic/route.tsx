import { ImageResponse } from "next/og";

// 1024x500 — Google Play Store "feature graphic" displayed at the top of
// the listing. Must be exactly these dimensions or Play Console rejects.
// Keep critical content well inside the safe area; Google sometimes
// overlays UI on the edges depending on placement.
export const runtime = "edge";

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
        {/* Gold halo behind the right side */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 50%, rgba(217,154,43,0.55) 0%, rgba(10,10,11,0) 60%), radial-gradient(circle at 0% 100%, rgba(16,211,154,0.18) 0%, rgba(10,10,11,0) 50%)",
            display: "flex",
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.4,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px",
            width: "100%",
          }}
        >
          {/* Left: brand + tagline + features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 620 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#f5c46b",
                fontSize: 16,
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: "#d99a2b",
                  color: "#0a0a0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                ✂
              </div>
              <span>Dallas · Texas</span>
            </div>

            <div
              style={{
                fontSize: 90,
                fontWeight: 900,
                letterSpacing: -3,
                lineHeight: 0.95,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ display: "flex" }}>The Cutting</span>
              <span style={{ color: "#f5c46b", display: "flex" }}>Cartel.</span>
            </div>

            <div
              style={{
                fontSize: 22,
                color: "rgba(250,250,247,0.78)",
                display: "flex",
                marginTop: 4,
              }}
            >
              Book the chair. Try the cut with AI. Walk in dialed in.
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {["Cutline AI", "Book online", "Pay your way"].map((p) => (
                <div
                  key={p}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(217,154,43,0.4)",
                    color: "#f5c46b",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "flex",
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero monogram disc */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 320,
              height: 320,
              borderRadius: 160,
              background: "#d99a2b",
              color: "#0a0a0b",
              fontSize: 220,
              fontWeight: 900,
              letterSpacing: -10,
              fontFamily: "ui-serif, Georgia, serif",
              boxShadow: "0 30px 100px rgba(217,154,43,0.55)",
            }}
          >
            TC
          </div>
        </div>

        {/* Barbershop stripe at bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 8,
            display: "flex",
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: ["#d99a2b", "#0a0a0b", "#fafaf7", "#0a0a0b"][i % 4],
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 500,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    }
  );
}
