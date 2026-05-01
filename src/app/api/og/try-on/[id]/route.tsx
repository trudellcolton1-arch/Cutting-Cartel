import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 630;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tryOn = await prisma.tryOnSession.findUnique({
    where: { id: params.id },
    include: { hairstyle: true, user: true },
  });

  const hairstyleName = tryOn?.hairstyle?.name ?? "Locked Cut";
  const customerFirst = (tryOn?.user?.name ?? "").split(" ")[0] || "Cutline AI";
  const beforeUrl = tryOn?.selfieUrl ?? null;
  const afterUrl = tryOn?.previewUrl ?? null;
  const fadeLabel =
    tryOn?.fade === 0 ? "no fade" : tryOn?.fade === 5 ? "skin fade" : `fade ${tryOn?.fade ?? 2}`;

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
        {/* glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(700px 400px at 50% -10%, rgba(217,154,43,0.45), transparent 60%), radial-gradient(500px 350px at 0% 110%, rgba(16,211,154,0.20), transparent 60%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: 48,
            width: "100%",
            gap: 28,
          }}
        >
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: "#d99a2b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0a0a0b",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                ✂
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>Cutline AI</div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "#f5c46b",
                  }}
                >
                  The Cutting Cartel
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(16,211,154,0.12)",
                border: "1px solid rgba(16,211,154,0.4)",
                color: "#5cf2c8",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ⚡ Locked the line
            </div>
          </div>

          {/* before / after */}
          <div style={{ display: "flex", gap: 24, alignItems: "stretch", flex: 1 }}>
            <Pane label="BEFORE" url={beforeUrl} accent="#3a3a44" />
            <ArrowDivider />
            <Pane label="AFTER" url={afterUrl ?? beforeUrl} accent="#d99a2b" highlight />
          </div>

          {/* footer info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 18, color: "rgba(250,250,247,0.6)" }}>{customerFirst} just locked in</div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                  color: "#fafaf7",
                  display: "flex",
                }}
              >
                {hairstyleName}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Pill>length {tryOn?.length ?? 3}</Pill>
                <Pill>{fadeLabel}</Pill>
                <Pill>cuttingcartel.com</Pill>
              </div>
            </div>
            <div
              style={{
                width: 220,
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
    ),
    {
      width: W,
      height: H,
      headers: {
        "cache-control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}

function Pane({
  label,
  url,
  accent,
  highlight,
}: {
  label: string;
  url: string | null;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 14,
          letterSpacing: 4,
          color: highlight ? "#f5c46b" : "rgba(250,250,247,0.5)",
          fontWeight: 700,
          display: "flex",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          borderRadius: 24,
          overflow: "hidden",
          border: `2px solid ${accent}`,
          boxShadow: highlight ? "0 30px 80px -20px rgba(217,154,43,0.4)" : "none",
          display: "flex",
          background: "#1a1a1f",
          position: "relative",
        }}
      >
        {url ? (
          // ImageResponse supports <img> with remote URLs.
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img
            src={url}
            width="100%"
            height="100%"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "rgba(250,250,247,0.4)",
            }}
          >
            no preview
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 60,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          background: "#d99a2b",
          color: "#0a0a0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          fontWeight: 900,
          boxShadow: "0 10px 40px rgba(217,154,43,0.5)",
        }}
      >
        →
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "6px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 16,
        color: "rgba(250,250,247,0.8)",
      }}
    >
      {children}
    </div>
  );
}
