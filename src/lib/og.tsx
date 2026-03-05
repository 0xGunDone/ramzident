import { ImageResponse } from "next/og";

export const ogSize = {
  width: 1200,
  height: 630,
};

export const ogContentType = "image/png";

const clampText = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;

interface OgCardOptions {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: string;
  tags?: string[];
}

export function createOgImage({
  eyebrow,
  title,
  description,
  accent,
  tags = [],
}: OgCardOptions) {
  const safeTitle = clampText(title, 90);
  const safeDescription = description ? clampText(description, 180) : "";
  const visibleTags = tags.filter(Boolean).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, rgba(201,176,113,0.22), transparent 34%), radial-gradient(circle at top right, rgba(23,60,67,0.18), transparent 28%), linear-gradient(180deg, #f8f3ea 0%, #f0e6d8 100%)",
          color: "#102e35",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -80,
            top: -80,
            width: 320,
            height: 320,
            borderRadius: "9999px",
            background: "rgba(201,176,113,0.12)",
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -50,
            width: 260,
            height: 260,
            borderRadius: "9999px",
            background: "rgba(23,60,67,0.12)",
            filter: "blur(28px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(16,46,53,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    color: "#b99858",
                  }}
                >
                  R
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div style={{ fontSize: 34, fontWeight: 700 }}>Рамзи Дент</div>
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "#b99858",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    стоматологическая клиника
                  </div>
                </div>
              </div>
              {eyebrow ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(185,152,88,0.24)",
                    background: "rgba(255,255,255,0.72)",
                    fontSize: 15,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "#b99858",
                  }}
                >
                  {eyebrow}
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 68,
                  lineHeight: 1.02,
                  fontWeight: 700,
                }}
              >
                <span>{safeTitle}</span>
                {accent ? (
                  <span style={{ color: "#b99858" }}>{clampText(accent, 72)}</span>
                ) : null}
              </div>
              {safeDescription ? (
                <div
                  style={{
                    fontSize: 28,
                    lineHeight: 1.45,
                    color: "#5f767b",
                    fontFamily: "Arial, sans-serif",
                    maxWidth: 860,
                  }}
                >
                  {safeDescription}
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {visibleTags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(16,46,53,0.1)",
                    background: "rgba(255,255,255,0.72)",
                    fontSize: 18,
                    fontFamily: "Arial, sans-serif",
                    color: "#24454d",
                  }}
                >
                  {clampText(tag, 28)}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 22px",
                borderRadius: 999,
                background: "#102e35",
                color: "white",
                fontSize: 18,
                fontFamily: "Arial, sans-serif",
                fontWeight: 700,
              }}
            >
              ramzident.ru
            </div>
          </div>
        </div>
      </div>
    ),
    ogSize
  );
}
