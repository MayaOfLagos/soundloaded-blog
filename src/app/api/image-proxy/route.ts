import { NextRequest, NextResponse } from "next/server";

// Max 10 MB to prevent memory exhaustion
const MAX_PROXY_SIZE = 10 * 1024 * 1024;

// Allowed domains — must be an exact match or a subdomain (e.g. cdn.soundloaded.ng)
const ALLOWED_DOMAINS = [
  "soundloaded.store",
  "r2.dev",
  "r2.cloudflarestorage.com",
  "soundloaded.ng",
];

function isDomainAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Block non-https and non-http schemes (no file://, data://, etc.)
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return new NextResponse("Invalid protocol", { status: 400 });
  }

  if (!isDomainAllowed(parsed.hostname)) {
    return new NextResponse("Forbidden domain", { status: 403 });
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return new NextResponse("Upstream error", { status: 502 });

    // Only proxy image content types
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Only image content types are allowed", { status: 403 });
    }

    // Enforce size limit
    const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_PROXY_SIZE) {
      return new NextResponse("Response too large", { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_PROXY_SIZE) {
      return new NextResponse("Response too large", { status: 413 });
    }

    const origin = req.headers.get("origin") ?? "";
    const host = req.headers.get("host") ?? "";
    const allowedOrigin =
      origin && (origin.endsWith("soundloaded.ng") || origin.endsWith("soundloaded.store") || origin.includes(host))
        ? origin
        : `https://${host}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": allowedOrigin,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
