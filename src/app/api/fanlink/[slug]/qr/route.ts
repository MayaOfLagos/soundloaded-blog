import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: { status: true },
  });

  if (!fanlink || fanlink.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloaded.ng";
  const url = `${appUrl}/fanlink/${slug}`;

  const format = (req.nextUrl.searchParams.get("format") ?? "png") as "png" | "svg";
  const size = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("size") ?? "400", 10), 100),
    1000
  );

  if (format === "svg") {
    const svg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `inline; filename="fanlink-${slug}.png"`,
    },
  });
}
