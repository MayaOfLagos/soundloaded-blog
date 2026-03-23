import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const CATEGORY_ICONS: Record<string, string> = {
  MUSIC: "\u266B",
  VIDEO: "\u25B6",
  NEWS: "\uD83D\uDCF0",
  GIST: "\uD83D\uDCAC",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Soundloaded";
  const category = searchParams.get("category") || "";
  const author = searchParams.get("author") || "";
  const icon = CATEGORY_ICONS[category.toUpperCase()] || "\u266B";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 70%, #0f0f1a 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 60px",
        position: "relative",
      }}
    >
      {/* Accent bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #e11d48, #f43f5e, #e11d48)",
        }}
      />

      {/* Category icon */}
      <div
        style={{
          fontSize: "64px",
          marginBottom: "20px",
          opacity: 0.6,
          display: "flex",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: title.length > 60 ? "32px" : title.length > 40 ? "40px" : "48px",
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "90%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {title.length > 80 ? title.slice(0, 80) + "..." : title}
      </div>

      {/* Category badge */}
      {category && (
        <div
          style={{
            marginTop: "24px",
            padding: "6px 20px",
            borderRadius: "20px",
            background: "rgba(225, 29, 72, 0.3)",
            border: "1px solid rgba(225, 29, 72, 0.5)",
            color: "#f43f5e",
            fontSize: "14px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "2px",
            display: "flex",
          }}
        >
          {category}
        </div>
      )}

      {/* Author */}
      {author && (
        <div
          style={{
            marginTop: "16px",
            color: "rgba(255,255,255,0.5)",
            fontSize: "16px",
            display: "flex",
          }}
        >
          by {author}
        </div>
      )}

      {/* Branding */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "40px",
          color: "rgba(255,255,255,0.25)",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        SOUNDLOADED
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
