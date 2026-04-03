import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Only allow R2 domains
  const allowed = ["soundloaded.store", "r2.dev", "r2.cloudflarestorage.com", "soundloaded.ng"];
  const parsed = new URL(url);
  if (!allowed.some((d) => parsed.hostname.endsWith(d))) {
    return new NextResponse("Forbidden domain", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse("Upstream error", { status: 502 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
