import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: {
      title: true,
      artistName: true,
      type: true,
      coverArt: true,
      accentColor: true,
      bgColor: true,
      description: true,
    },
  });

  const accent = fanlink?.accentColor ?? "#e11d48";
  const title = fanlink?.title ?? "Check out this release";
  const artist = fanlink?.artistName ?? "";
  const type = fanlink?.type ?? "SINGLE";
  const desc = fanlink?.description ?? "";
  const cover = fanlink?.coverArt;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: fanlink?.bgColor
          ? `linear-gradient(135deg, ${fanlink.bgColor}cc 0%, #0a0a0a 60%)`
          : "linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 60%)",
        fontFamily: "sans-serif",
        padding: "60px",
        alignItems: "center",
        gap: "60px",
      }}
    >
      {/* Cover art */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={title}
          width={400}
          height={400}
          style={{ borderRadius: "24px", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: "400px",
            height: "400px",
            borderRadius: "24px",
            background: `${accent}33`,
            border: `2px solid ${accent}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "80px" }}>🎵</div>
        </div>
      )}

      {/* Text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        <div
          style={{
            background: `${accent}22`,
            border: `1px solid ${accent}44`,
            borderRadius: "8px",
            padding: "6px 14px",
            color: accent,
            fontSize: "14px",
            fontWeight: 700,
            width: "fit-content",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {type}
        </div>

        <div style={{ fontSize: "56px", fontWeight: 900, color: "white", lineHeight: 1.1 }}>
          {title}
        </div>

        <div style={{ fontSize: "24px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
          {artist}
        </div>

        {desc && (
          <div
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.4)",
              marginTop: "8px",
              maxWidth: "500px",
            }}
          >
            {desc.slice(0, 120)}
            {desc.length > 120 ? "…" : ""}
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: accent,
            }}
          />
          <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>
            soundloaded.ng/fanlink/{slug}
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
